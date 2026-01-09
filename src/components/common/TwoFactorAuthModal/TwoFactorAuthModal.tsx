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
        PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle display="flex" alignItems="center" gap={1}>
        <VpnKey color="primary" /> {title}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
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
            // ✅ MEJORAS DE UX AQUÍ:
            autoComplete="one-time-code" // Permite autocompletado nativo del sistema
            inputProps={{ 
              inputMode: 'numeric', // Fuerza teclado numérico en móviles
              pattern: '[0-9]*',
              style: { 
                  textAlign: 'center', 
                  letterSpacing: 8, // Más espacio para que parezca un PIN
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
              },
              maxLength: 6 
            }}
            disabled={isLoading}
            error={!!error}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isLoading} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={code.length !== 6 || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {isLoading ? "Verificando..." : "Verificar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TwoFactorAuthModal;