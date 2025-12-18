import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Divider, Stack, Alert, CircularProgress, 
  Paper 
} from '@mui/material';
import { MonetizationOn, VerifiedUser, Info } from '@mui/icons-material';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  proyecto: ProyectoDto | null;
  isLoading: boolean;
}

export const SuscribirseModal: React.FC<Props> = ({ 
  open, onClose, onConfirm, proyecto, isLoading 
}) => {
  
  if (!proyecto) return null;

  // Formateador de moneda consistente
  const montoFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(Number(proyecto.monto_inversion));

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedUser color="primary" />
        Confirmar Suscripción
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Estás a punto de iniciar tu plan de ahorro para el proyecto:
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">Concepto</Typography>
              <Typography variant="body2" fontWeight={600}>Pago Inicial (Cuota 1)</Typography>
            </Box>
            
            <Divider />
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <MonetizationOn color="success" />
                <Typography variant="body1" fontWeight={600}>Total a Pagar</Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {montoFormateado}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            <strong>Paso 1:</strong> Serás redirigido a Mercado Pago para abonar la primera cuota.
            <br/>
            <strong>Paso 2:</strong> Al confirmar el pago, tu suscripción se activará automáticamente.
            <br/>
            <strong>Paso 3:</strong> Podrás firmar tu contrato digital desde el panel.
          </Typography>
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
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          {isLoading ? 'Procesando...' : 'Ir a Pagar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};