import React from 'react';
import { Typography, Box, Zoom, useTheme, alpha, Avatar } from '@mui/material';
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
      onClose={() => {}} // Función vacía intencional (Modal bloqueante)
      disableClose // Evita cierre por ESC o click afuera
      title="¡Pago Acreditado!"
      subtitle="Tu inversión ha sido procesada correctamente"
      headerColor="success"
      icon={<CheckCircle />}
      maxWidth="xs"
      // Configuración del botón de acción
      confirmText="Firmar Contrato Ahora"
      confirmButtonIcon={<ArrowForward />}
      confirmButtonColor="primary"
      onConfirm={onContinuar}
      hideCancelButton
    >
      <Box sx={{ textAlign: 'center', py: 3 }}>
        
        {/* Animación del Icono Central */}
        <Zoom in={open} style={{ transitionDelay: '200ms' }}>
          <Box sx={{ display: 'inline-flex', position: 'relative', mb: 3 }}>
            {/* Efecto de "Halo" externo */}
            <Box 
              sx={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.success.main, 0.05),
                zIndex: 0
              }} 
            />
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80,
                bgcolor: alpha(theme.palette.success.main, 0.1), 
                color: 'success.main',
                position: 'relative',
                zIndex: 1
              }}
            >
              <CheckCircle sx={{ fontSize: 40 }} />
            </Avatar>
          </Box>
        </Zoom>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          paragraph 
          sx={{ maxWidth: '280px', mx: 'auto', mb: 4, lineHeight: 1.6 }}
        >
          Para finalizar el proceso legal y asegurar tu lote, necesitamos tu firma digital en el contrato.
        </Typography>

        <Typography variant="caption" color="text.disabled" display="block">
            Paso final del proceso de inversión
        </Typography>

      </Box>
    </BaseModal>
  );
};