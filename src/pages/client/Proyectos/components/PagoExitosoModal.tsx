import React from 'react';
import { Dialog, DialogContent, Typography, Box, Button, Zoom } from '@mui/material';
import { CheckCircleOutline, Description } from '@mui/icons-material';

interface Props {
  open: boolean;
  onContinuar: () => void;
}

export const PagoExitosoModal: React.FC<Props> = ({ open, onContinuar }) => {
  return (
    <Dialog 
      open={open} 
      maxWidth="xs" // 👈 Más compacto para mensajes de éxito
      fullWidth 
      PaperProps={{ 
        sx: { borderRadius: 4, textAlign: 'center', p: 1 } 
      }}
      // Opcional: Evitar que cierren sin querer si el paso de firma es obligatorio
      // disableEscapeKeyDown 
    >
      <DialogContent sx={{ py: 4 }}>
        
        {/* Icono con fondo sutil */}
        <Box display="flex" justifyContent="center" mb={2}>
            <Zoom in={open} style={{ transitionDelay: '200ms' }}>
                <Box 
                    sx={{ 
                        bgcolor: 'rgba(46, 125, 50, 0.08)', // Verde muy suave
                        borderRadius: '50%',
                        p: 2,
                        display: 'inline-flex'
                    }}
                >
                    <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main' }} />
                </Box>
            </Zoom>
        </Box>
        
        <Typography variant="h5" fontWeight={800} gutterBottom>
          ¡Pago Acreditado!
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph sx={{ px: 2 }}>
          Tu inversión ha sido procesada correctamente. <br />
          El siguiente y último paso es <strong>formalizar la operación</strong>.
        </Typography>

        <Box mt={3}>
          <Button 
            variant="contained" 
            size="large" 
            fullWidth 
            color="primary" 
            endIcon={<Description />}
            onClick={onContinuar}
            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2 }}
          >
            Firmar Contrato Ahora
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};