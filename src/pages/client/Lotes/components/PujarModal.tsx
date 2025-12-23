import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, Box, CircularProgress, 
  Stack, Divider, InputAdornment 
} from '@mui/material';
import { Gavel, MonetizationOn, Token, TrendingUp, VerifiedUser } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PujaService from '../../../../Services/puja.service';
import type { LoteDto } from '../../../../types/dto/lote.dto';

// Interfaz local para el DTO extendido
interface LoteConPuja extends LoteDto {
    ultima_puja?: { monto: number; id_usuario: number; }; 
}

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  soyGanador?: boolean; // 🟢 Nuevo prop opcional
}

export const PujarModal: React.FC<Props> = ({ open, onClose, lote: loteProp, soyGanador = false }) => {
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const lote = loteProp as LoteConPuja | null;

  useEffect(() => {
    if (open) {
      setMonto('');
      setError(null);
    }
  }, [open, lote]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lote) return;
      await PujaService.create({
        id_lote: lote.id,
        monto_puja: Number(monto)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] }); 
      queryClient.invalidateQueries({ queryKey: ['lote'] });
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      
      const msg = soyGanador ? '¡Has actualizado tu puja exitosamente!' : '¡Oferta realizada con éxito!';
      alert(msg); // Sugerencia: Reemplazar por Toast/Snackbar
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al realizar la puja. Verifica tus tokens.');
    }
  });

  if (!lote) return null;

  // Cálculos de precio
  const ultimaPujaMonto = lote.ultima_puja?.monto ? Number(lote.ultima_puja.monto) : 0;
  const precioBase = Number(lote.precio_base);
  const precioActual = ultimaPujaMonto > precioBase ? ultimaPujaMonto : precioBase;
  const hayPujasPrevias = ultimaPujaMonto > precioBase;

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = () => {
    if (!monto) return;
    const valorOferta = Number(monto);
    
    // Validación: Debe ser mayor al precio actual
    if (valorOferta <= precioActual) {
      setError(`La oferta debe ser mayor a ${formatMoney(precioActual)}`);
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Gavel color="primary" /> {soyGanador ? 'Actualizar Oferta' : 'Realizar Oferta'}
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} mt={1}>
          
          {/* Información del Lote y Precio a Vencer */}
          <Box p={2} 
               bgcolor={soyGanador ? "success.50" : (hayPujasPrevias ? "warning.50" : "grey.50")} 
               borderRadius={2} border="1px solid" borderColor="divider">
            
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {lote.nombre_lote}
            </Typography>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                {soyGanador ? <VerifiedUser fontSize="inherit" color="success"/> : (hayPujasPrevias ? <TrendingUp fontSize="inherit"/> : <MonetizationOn fontSize="inherit"/>)}
                {soyGanador ? 'Tu Puja Actual:' : (hayPujasPrevias ? 'Puja Más Alta:' : 'Precio Base:')}
              </Typography>
              <Typography variant="h6" color={soyGanador ? "success.main" : (hayPujasPrevias ? "warning.main" : "primary.main")} fontWeight={700}>
                {formatMoney(precioActual)}
              </Typography>
            </Stack>

            {soyGanador && (
               <Typography variant="caption" color="success.main" display="block" mt={1}>
                 ¡Vas ganando! Sube tu oferta para proteger tu posición.
               </Typography>
            )}
          </Box>

          {/* Input de Oferta */}
          <TextField
            autoFocus
            fullWidth
            label="Tu Nueva Oferta"
            placeholder={`Ingresa más de ${formatMoney(precioActual)}`}
            type="number"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setError(null);
            }}
            disabled={mutation.isPending}
            InputProps={{
              startAdornment: <InputAdornment position="start"><MonetizationOn color="action" /></InputAdornment>,
            }}
            error={!!error}
            helperText={error}
          />

          <Divider />

          {/* Aviso de Token Inteligente */}
          {soyGanador ? (
            <Alert severity="info" icon={<Token fontSize="inherit" />} sx={{ alignItems: 'center' }}>
                <Typography variant="caption" display="block">
                  Al actualizar tu propia puja ganadora, <strong>no se consumen tokens adicionales</strong>.
                </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" icon={<Token fontSize="inherit" />} sx={{ alignItems: 'center' }}>
                <Typography variant="caption" display="block">
                  Esta acción consumirá <strong>1 Token de Subasta</strong> si es tu primera participación en este lote.
                </Typography>
            </Alert>
          )}

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={mutation.isPending || !monto || Number(monto) <= precioActual}
          startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Gavel />}
          color={soyGanador ? "success" : "primary"}
        >
          {mutation.isPending ? 'Procesando...' : (soyGanador ? 'Actualizar Puja' : 'Confirmar Oferta')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};