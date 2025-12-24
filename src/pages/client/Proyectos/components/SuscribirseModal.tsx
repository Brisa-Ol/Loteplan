import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Divider, Stack, Alert, CircularProgress, 
  Paper, useTheme, alpha 
} from '@mui/material';
import { MonetizationOn, VerifiedUser, Info, Lock } from '@mui/icons-material';
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
  const theme = useTheme();

  if (!proyecto) return null;

  // Formateador de moneda consistente
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
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
        <Box sx={{ 
            p: 1.5, borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: 'primary.main', display: 'flex' 
        }}>
            <VerifiedUser fontSize="medium" />
        </Box>
        <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Confirmar Suscripción</Typography>
            <Typography variant="caption" color="text.secondary">Estás suscribiéndote como Ahorrista</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 3 }}>
        <Box mb={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Estás a punto de iniciar tu plan de ahorro para:
          </Typography>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
            {proyecto.nombre_proyecto}
          </Typography>
        </Box>

        {/* Resumen Financiero (Estilo Ticket) */}
        <Paper 
            elevation={0} 
            sx={{ 
                p: 3, 
                borderRadius: 3, 
                mb: 3,
                border: `1px dashed ${theme.palette.divider}`
            }}
        >
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Concepto</Typography>
              <Typography variant="body2" fontWeight={700}>Pago Inicial (Cuota 1)</Typography>
            </Box>
            
            <Divider />
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center" color="text.primary">
                <MonetizationOn fontSize="small" color="success" />
                <Typography variant="body1" fontWeight={600}>Total a Pagar</Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} color="success.main">
                {montoFormateado}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Alert 
            severity="info" 
            icon={<Info fontSize="inherit" />} 
            sx={{ 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                color: theme.palette.info.dark
            }}
        >
          <Typography variant="body2" component="div" fontWeight={500}>
            <Box component="span" display="block" mb={0.5}><strong>1.</strong> Serás redirigido a Mercado Pago para abonar la primera cuota.</Box>
            <Box component="span" display="block" mb={0.5}><strong>2.</strong> Al confirmar, tu suscripción se activará automáticamente.</Box>
            <Box component="span" display="block"><strong>3.</strong> Podrás firmar tu contrato digital desde el panel.</Box>
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button 
            onClick={onClose} 
            disabled={isLoading} 
            color="inherit" 
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={onConfirm} 
          disabled={isLoading}
          size="large"
          disableElevation
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
          sx={{ px: 4, fontWeight: 700, borderRadius: 2, flexGrow: 1 }}
        >
          {isLoading ? 'Procesando...' : 'Ir a Pagar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};