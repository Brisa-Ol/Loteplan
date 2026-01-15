import React from 'react';
import { Typography, Box, Zoom, useTheme, alpha, Stack, Avatar } from '@mui/material';
import { CheckCircle, ArrowForward } from '@mui/icons-material';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onContinuar: () => void;
}

export const PagoExitosoModal: React.FC<Props> = ({ open, onContinuar }) => {
  const theme = useTheme();

  return (
    <BaseModal
      open={open}
      // No pasamos onClose para obligar a la acción positiva, o pasamos una función vacía si BaseModal lo requiere obligatoriamente.
      onClose={() => {}} 
      title="¡Pago Acreditado!"
      subtitle="Tu inversión ha sido procesada correctamente"
      headerColor="success"
      icon={<CheckCircle />}
      maxWidth="xs"
      // Configuración del botón principal
      confirmText="Firmar Contrato Ahora"
      confirmButtonIcon={<ArrowForward />}
      confirmButtonColor="primary"
      onConfirm={onContinuar}
      // Ocultamos elementos distractores
      hideCancelButton
      disableClose // Evita cierre con ESC o click afuera
    >
      <Box textAlign="center" py={2}>
        
        {/* Animación del Icono Central (Opcional, adicional al del header) */}
        <Box display="flex" justifyContent="center" mb={3}>
          <Zoom in={open} style={{ transitionDelay: '200ms' }}>
            <Avatar 
              sx={{ 
                width: 88, 
                height: 88,
                bgcolor: alpha(theme.palette.success.main, 0.1), 
                color: theme.palette.success.main,
                boxShadow: `0 0 0 12px ${alpha(theme.palette.success.main, 0.05)}`
              }}
            >
              <CheckCircle sx={{ fontSize: 48 }} />
            </Avatar>
          </Zoom>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ px: 1, mb: 1, lineHeight: 1.6 }}>
          Para finalizar el proceso legal y asegurar tu lote, necesitamos tu firma digital en el contrato.
        </Typography>

        <Stack spacing={1} mt={4}>
            <Typography variant="caption" color="text.disabled">
                Paso final del proceso de inversión
            </Typography>
        </Stack>

      </Box>
    </BaseModal>
  );
};