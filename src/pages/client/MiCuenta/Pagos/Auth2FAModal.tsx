// src/components/common/Auth2FAModal/Auth2FAModal.tsx
import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, CircularProgress, Alert 
} from '@mui/material';
import { Security } from '@mui/icons-material';

interface Auth2FAModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const Auth2FAModal: React.FC<Auth2FAModalProps> = ({ 
  open, onClose, onConfirm, isLoading, error 
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.length === 6) {
      onConfirm(code);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" /> Verificación de Seguridad
      </DialogTitle>
      <DialogContent>
        <Box py={2}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Tu cuenta tiene la autenticación de dos pasos activada. 
            Ingresa el código de 6 dígitos de tu aplicación autenticadora para continuar con el pago.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Código 2FA (6 dígitos)"
            type="text"
            fullWidth
            variant="outlined"
            value={code}
            onChange={(e) => {
              // Solo permitir números y máximo 6 caracteres
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val.length <= 6) setCode(val);
            }}
            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4, fontSize: '1.2rem' } }}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={code.length !== 6 || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Verificar y Pagar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};