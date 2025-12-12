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
  onSubmit: (code: string) => void; // Función que recibe el código
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
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle display="flex" alignItems="center" gap={1}>
        <VpnKey color="primary" /> {title}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
              // Solo números, máx 6
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setCode(val);
            }}
            inputProps={{ 
              style: { textAlign: 'center', letterSpacing: 4, fontSize: '1.2rem' },
              maxLength: 6 
            }}
            disabled={isLoading}
            error={!!error}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={code.length !== 6 || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? "Verificando..." : "Verificar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TwoFactorAuthModal;