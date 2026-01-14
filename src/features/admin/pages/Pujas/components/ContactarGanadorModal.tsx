import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Stack, Alert, Typography, TextField, useTheme, alpha, CircularProgress 
} from '@mui/material';
import { ContentCopy, Send } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import useSnackbar from '../../../../../shared/hooks/useSnackbar';
import MensajeService from '../../../../../core/api/services/mensaje.service';



interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  montoGanador: number;
}

const ContactarGanadorModal: React.FC<Props> = ({ open, onClose, lote, montoGanador }) => {
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  // Limpiar el campo cuando se abre el modal
  useEffect(() => {
    if (open) setMensajePersonalizado('');
  }, [open]);

  if (!lote) return null;

  const mensajeBase = `Hola Usuario #${lote.id_ganador},\n\nFelicitaciones por ganar la subasta del lote "${lote.nombre_lote}".\n\nMonto a pagar: $${montoGanador.toLocaleString('es-AR')}\nPlazo de pago: 90 días.\n\nPor favor, contacta con administración para coordinar el pago.`;

  // 1. Mutación para enviar el mensaje a la API
  const enviarMensajeMutation = useMutation({
    mutationFn: async () => {
      if (!lote.id_ganador) throw new Error("No hay un ganador definido para este lote.");

      await MensajeService.enviarMensaje({
        id_receptor: lote.id_ganador,
        contenido: mensajePersonalizado.trim() || mensajeBase // Usa el default si está vacío
      });
    },
    onSuccess: () => {
      showSuccess('Mensaje enviado exitosamente al buzón del usuario.');
      onClose();
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Error al enviar el mensaje.');
    }
  });

  // 2. Handler para copiar al portapapeles (útil para WhatsApp/Email externo)
  const handleCopiar = () => {
    navigator.clipboard.writeText(mensajePersonalizado || mensajeBase);
    showSuccess('Mensaje copiado al portapapeles');
  };

  // 3. Handler para enviar por el sistema interno
  const handleEnviar = () => {
    enviarMensajeMutation.mutate();
  };

  return (
    <Dialog 
        open={open} 
        onClose={enviarMensajeMutation.isPending ? undefined : onClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      <DialogTitle sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), pb: 2 }}>
        Contactar Ganador - Lote #{lote.id}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              Usuario #{lote.id_ganador}
            </Typography>
            <Typography variant="caption">
              Lote: {lote.nombre_lote} | Intentos Fallidos: {lote.intentos_fallidos_pago}/3
            </Typography>
          </Alert>

          <TextField
            label="Mensaje personalizado"
            multiline 
            rows={6} 
            fullWidth
            value={mensajePersonalizado}
            onChange={(e) => setMensajePersonalizado(e.target.value)}
            placeholder={mensajeBase}
            helperText="Si dejas este campo vacío, se enviará el mensaje predeterminado."
            disabled={enviarMensajeMutation.isPending}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        {/* Botón Copiar (Secundario) */}
        <Button 
            onClick={handleCopiar} 
            color="primary" 
            startIcon={<ContentCopy />}
            disabled={enviarMensajeMutation.isPending}
            sx={{ mr: 'auto' }} // Alinea a la izquierda
        >
            Copiar Texto
        </Button>

        {/* Botón Cerrar */}
        <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={enviarMensajeMutation.isPending}
        >
            Cancelar
        </Button>

        {/* Botón Enviar (Principal) */}
        <Button 
            onClick={handleEnviar} 
            variant="contained" 
            color="primary"
            startIcon={enviarMensajeMutation.isPending ? <CircularProgress size={20} color="inherit"/> : <Send />}
            disabled={enviarMensajeMutation.isPending}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
        >
            {enviarMensajeMutation.isPending ? 'Enviando...' : 'Enviar Ahora'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactarGanadorModal;