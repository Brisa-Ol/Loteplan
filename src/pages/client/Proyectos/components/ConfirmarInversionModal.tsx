import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Divider, Stack, Alert, CircularProgress, 
  Paper, useTheme, alpha 
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
  const theme = useTheme();

  if (!proyecto) return null;

  const montoFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: proyecto.moneda === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(Number(proyecto.monto_inversion));

  return (
    <Dialog 
        open={open} 
        onClose={isLoading ? undefined : onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ 
            p: 1, borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: 'primary.main', display: 'flex' 
        }}>
            <Business />
        </Box>
        <Typography variant="h6" fontWeight={700}>Confirmar Inversión</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Box mb={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Estás a punto de realizar una inversión directa en:
          </Typography>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>

        <Paper 
            elevation={0} 
            sx={{ 
                p: 2, 
                bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                borderRadius: 2, 
                mb: 3,
                border: `1px solid ${theme.palette.divider}`
            }}
        >
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">Concepto</Typography>
              <Typography variant="body2" fontWeight={600}>Pago Único de Inversión</Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1} color="success.main">
                <MonetizationOn fontSize="small" />
                <Typography variant="body1" fontWeight={600}>Monto Total</Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} color="success.main">
                {montoFormateado}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Alert severity="info" icon={<Info fontSize="inherit" />} sx={{ borderRadius: 2 }}>
          Al confirmar, serás redirigido a la pasarela de pagos segura.<br/>
          Ten listo tu método de autenticación (2FA).
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={onConfirm} 
          disabled={isLoading}
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MonetizationOn />}
          sx={{ px: 4, fontWeight: 700 }}
        >
          {isLoading ? 'Procesando...' : 'Ir a Pagar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};