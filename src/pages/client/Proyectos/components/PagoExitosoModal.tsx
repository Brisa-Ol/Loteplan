import React from 'react';
import { 
  Dialog, DialogContent, Typography, Box, Button, Zoom, 
  useTheme, alpha, Stack, Avatar 
} from '@mui/material';
import { CheckCircle, Description, ArrowForward } from '@mui/icons-material';

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
        sx: { 
            borderRadius: 4, 
            textAlign: 'center', 
            p: 2,
            boxShadow: theme.shadows[10], // Sombra profunda para destacar sobre el contenido
            backgroundImage: 'linear-gradient(to bottom, #fff, #fafafa)'
        } 
      }}
    >
      <DialogContent sx={{ py: 4, px: 3 }}>
        
        <Box display="flex" justifyContent="center" mb={4}>
          <Zoom in={open} style={{ transitionDelay: '200ms' }}>
            <Avatar 
              sx={{ 
                width: 88, 
                height: 88,
                bgcolor: alpha(theme.palette.success.main, 0.1), 
                color: theme.palette.success.main,
                // Efecto de anillo exterior (Glow)
                boxShadow: `0 0 0 12px ${alpha(theme.palette.success.main, 0.05)}`,
                mb: 1
              }}
            >
              <CheckCircle sx={{ fontSize: 48 }} />
            </Avatar>
          </Zoom>
        </Box>
        
        <Typography variant="h4" fontWeight={800} gutterBottom color="text.primary">
          ¡Pago Acreditado!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ px: 1, mb: 4, lineHeight: 1.6 }}>
          Tu inversión ha sido procesada correctamente.<br />
          Para finalizar el proceso legal, necesitamos tu firma.
        </Typography>

        <Stack spacing={2}>
            <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                color="primary" 
                endIcon={<ArrowForward />}
                onClick={onContinuar}
                disableElevation
                sx={{ 
                    py: 1.8, 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    borderRadius: 3,
                    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                        transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s'
                }}
            >
                Firmar Contrato Ahora
            </Button>
            
            <Typography variant="caption" color="text.disabled">
                Paso final para asegurar tu lote
            </Typography>
        </Stack>

      </DialogContent>
    </Dialog>
  );
};