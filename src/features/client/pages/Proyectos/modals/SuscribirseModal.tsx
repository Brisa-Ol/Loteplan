import React from 'react';
import { 
  Typography, Box, Divider, Stack, Alert, Paper, useTheme, alpha 
} from '@mui/material';
import { MonetizationOn, VerifiedUser, Info, Lock } from '@mui/icons-material';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';


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
    <BaseModal
      open={open}
      onClose={onClose}
      title="Confirmar Suscripción"
      subtitle="Estás suscribiéndote como Ahorrista"
      icon={<VerifiedUser />}
      headerColor="primary"
      maxWidth="sm"
      confirmText="Ir a Pagar"
      confirmButtonIcon={<Lock />}
      onConfirm={onConfirm}
      isLoading={isLoading}
      disableConfirm={isLoading}
    >
      <Stack spacing={3}>
        
        {/* Título y Contexto */}
        <Box>
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
                bgcolor: alpha(theme.palette.background.paper, 0.5),
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

        {/* Pasos a seguir */}
        <Alert 
            severity="info" 
            icon={<Info fontSize="inherit" />} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" component="div" fontWeight={500}>
            <Box component="span" display="block" mb={0.5}><strong>1.</strong> Serás redirigido a la pasarela de pagos.</Box>
            <Box component="span" display="block" mb={0.5}><strong>2.</strong> Al confirmar, tu suscripción se activará.</Box>
            <Box component="span" display="block"><strong>3.</strong> Podrás firmar tu contrato desde el panel.</Box>
          </Typography>
        </Alert>

      </Stack>
    </BaseModal>
  );
};