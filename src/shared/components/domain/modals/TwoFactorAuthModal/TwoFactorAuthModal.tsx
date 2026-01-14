import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, CircularProgress, 
  Box
} from '@mui/material';
import { VpnKey } from '@mui/icons-material';

interface TwoFactorAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isLoading: boolean;
  error: string | null;
  title?: string;
  description?: string;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
  title = "Verificación de Seguridad",
  description = "Tu cuenta tiene activada la autenticación de dos factores. Ingresa el código de 6 dígitos de tu aplicación."
}) => {
  const [code, setCode] = useState('');

  // Limpiar el input cuando se abre/cierra el modal
  useEffect(() => {
    if (open) setCode('');
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: { xs: 2, sm: 3 },
          mx: { xs: 2, sm: 4 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' }
        } 
      }}
    >
      <DialogTitle 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: { xs: 1, sm: 1.5 },
          pb: { xs: 2, sm: 2.5 },
          pt: { xs: 2.5, sm: 3 },
          px: { xs: 2.5, sm: 3 },
          fontSize: { xs: '1.125rem', sm: '1.25rem' }
        }}
      >
        <VpnKey 
          color="primary" 
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} 
        />
        {title}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1.5, sm: 2 }
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 2.5, sm: 3 },
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              lineHeight: 1.6
            }}
          >
            {description}
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: { xs: 2.5, sm: 3 }, 
                borderRadius: 2,
                fontSize: { xs: '0.8125rem', sm: '0.875rem' }
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            label="Código 2FA"
            placeholder="000 000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setCode(val);
            }}
            autoComplete="one-time-code"
            inputProps={{ 
              inputMode: 'numeric',
              pattern: '[0-9]*',
              style: { 
                textAlign: 'center', 
                letterSpacing: 8,
                fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', // Tamaño fluido
                fontWeight: 'bold'
              },
              maxLength: 6 
            }}
            InputLabelProps={{
              sx: { fontSize: { xs: '0.9375rem', sm: '1rem' } }
            }}
            disabled={isLoading}
            error={!!error}
            sx={{
              '& .MuiOutlinedInput-root': {
                py: { xs: 1, sm: 1.5 }
              }
            }}
          />

          <Box 
            sx={{ 
              mt: { xs: 2, sm: 2.5 },
              display: 'flex',
              justifyContent: 'center',
              gap: 1
            }}
          >
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: { xs: 8, sm: 10 },
                  height: { xs: 8, sm: 10 },
                  borderRadius: '50%',
                  bgcolor: i < code.length ? 'primary.main' : 'grey.300',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            px: { xs: 2.5, sm: 3 }, 
            pb: { xs: 2.5, sm: 3 },
            pt: { xs: 1.5, sm: 2 },
            gap: { xs: 1, sm: 1.5 },
            flexDirection: { xs: 'column', sm: 'row' }
          }}
        >
          <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={isLoading} 
            sx={{ 
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 },
              py: { xs: 1.25, sm: 1 }
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={code.length !== 6 || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              borderRadius: 2, 
              px: { xs: 4, sm: 3 },
              py: { xs: 1.25, sm: 1 },
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 }
            }}
          >
            {isLoading ? "Verificando..." : "Verificar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TwoFactorAuthModal;