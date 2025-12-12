import React from 'react';
import { Dialog, DialogContent, Typography, Box, Button, Zoom } from '@mui/material';
import { CheckCircleOutline, Description } from '@mui/icons-material';

interface Props {
  open: boolean;
  onContinuar: () => void;
}

export const PagoExitosoModal: React.FC<Props> = ({ open, onContinuar }) => {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', p: 2 } }}>
      <DialogContent>
        <Zoom in={open} style={{ transitionDelay: '200ms' }}>
          <CheckCircleOutline sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        </Zoom>
        
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ¡Pago Acreditado!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Tu inversión ha sido procesada correctamente. El siguiente y último paso es formalizar la operación.
        </Typography>

        <Box mt={4}>
          <Button 
            variant="contained" 
            size="large" 
            fullWidth 
            color="primary" 
            endIcon={<Description />}
            onClick={onContinuar}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            Firmar Contrato Ahora
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};