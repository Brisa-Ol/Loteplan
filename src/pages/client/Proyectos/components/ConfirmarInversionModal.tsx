import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Divider, Stack, Alert, CircularProgress, 
  Paper 
} from '@mui/material';
import { MonetizationOn, Business, Info } from '@mui/icons-material';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';


interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  proyecto: ProyectoDto | null;
  isLoading: boolean;
}

export const ConfirmarInversionModal: React.FC<Props> = ({ 
  open, onClose, onConfirm, proyecto, isLoading 
}) => {
  if (!proyecto) return null;

  const montoFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS', // Ajuste dinámico
    minimumFractionDigits: 0
  }).format(Number(proyecto.monto_inversion));

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Business color="primary" />
        Confirmar Inversión Directa
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Estás a punto de realizar una inversión directa en el proyecto:
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">Concepto</Typography>
              <Typography variant="body2" fontWeight={600}>Pago Único de Inversión</Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <MonetizationOn color="success" />
                <Typography variant="body1" fontWeight={600}>Monto Total</Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {montoFormateado}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Alert severity="info" icon={<Info />}>
          Al confirmar, serás redirigido a la pasarela de pagos segura.
          <br/>
          Recuerda tener tu método de autenticación (2FA) listo si se requiere.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit">
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={onConfirm} 
          disabled={isLoading}
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MonetizationOn />}
        >
          {isLoading ? 'Procesando...' : 'Ir a Pagar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};