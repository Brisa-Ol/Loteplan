import React from 'react';
import { Dialog, DialogContent, Typography, Box, Button, Zoom, useTheme, alpha } from '@mui/material';
import { CheckCircleOutline, Description } from '@mui/icons-material';

interface Props {
  open: boolean;
  onContinuar: () => void;
}

export const PagoExitosoModal: React.FC<Props> = ({ open, onContinuar }) => {
  const theme = useTheme();

  return (
    <Dialog 
      open={open} 
      maxWidth="xs" 
      fullWidth 
      PaperProps={{ 
        sx: { borderRadius: 4, textAlign: 'center', p: 1 } 
      }}
    >
      <DialogContent sx={{ py: 4 }}>
        
        <Box display="flex" justifyContent="center" mb={3}>
          <Zoom in={open} style={{ transitionDelay: '200ms' }}>
            <Box 
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1), 
                borderRadius: '50%',
                p: 3,
                display: 'inline-flex'
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main' }} />
            </Box>
          </Zoom>
        </Box>
        
        <Typography variant="h5" fontWeight={800} gutterBottom color="text.primary">
          ¡Pago Acreditado!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ px: 2 }}>
          Tu inversión ha sido procesada correctamente. <br />
          El siguiente paso es <strong>formalizar la operación</strong>.
        </Typography>

        <Box mt={4}>
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