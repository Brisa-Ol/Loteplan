// src/components/auth/TwoFactorAuthModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, CircularProgress, 
  Box, Stack, useTheme, useMediaQuery, alpha, Avatar, Slide,
  Fade
} from '@mui/material';

import { VpnKey, Security } from '@mui/icons-material';
import type { TransitionProps } from 'node_modules/@mui/material/esm/transitions/transition';

// ════════════════════════════════════════════════════════════
// ✨ UX: TRANSICIÓN SLIDE UP
// ════════════════════════════════════════════════════════════
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface TwoFactorAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isLoading: boolean;
  error?: string | null;
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
  description = "Ingresa el código de 6 dígitos generado por tu aplicación autenticadora."
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [code, setCode] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (open) setCode('');
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length === 6 && !isLoading) {
      onSubmit(code);
    }
  };

  // ✨ UX: Manejo inteligente de cambios
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(val);
    
    // Opcional: Auto-submit si el usuario pega el código completo (longitud 6)
    // if (val.length === 6) onSubmit(val); 
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : onClose} 
      TransitionComponent={Transition} // ✨ Animación
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        elevation: 24,
        sx: {
          borderRadius: 4, // ✨ Estilo consistente con LogoutDialog
          overflow: 'hidden',
          boxShadow: theme.shadows[10],
          m: 2
        }
      }}
    >
      <DialogTitle 
        sx={{ 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            gap: 2,
            pt: 4,
            pb: 1,
            textAlign: 'center'
        }}
      >
        {/* ✨ Avatar con efecto Halo (Estilo Seguridad) */}
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.05)}`,
            mb: 1
          }}
        >
          <Security sx={{ fontSize: 32 }} />
        </Avatar>

        <Box>
            <Typography variant="h6" component="div" fontWeight={800} gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '280px', mx: 'auto', lineHeight: 1.5 }}>
                {description}
            </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2, pb: 1, px: 3 }}>
          <Stack spacing={3}>
            
            {/* Mensaje de Error con animación */}
            {error && (
              <Fade in={!!error}>
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2, fontWeight: 500 }}>
                    {error}
                </Alert>
              </Fade>
            )}

            {/* Input Grande tipo OTP */}
            <Box sx={{ position: 'relative' }}>
                <TextField
                    autoFocus
                    fullWidth
                    placeholder="000 000"
                    value={code}
                    onChange={handleChange}
                    autoComplete="one-time-code"
                    inputProps={{ 
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 6,
                        style: { 
                            textAlign: 'center', 
                            letterSpacing: '0.6em', // ✨ Espaciado amplio para legibilidad
                            fontSize: '1.75rem', 
                            fontWeight: 700,
                            padding: '16px',
                            fontFamily: 'monospace' // ✨ Alineación perfecta de números
                        }
                    }}
                    disabled={isLoading}
                    error={!!error}
                    color="primary"
                    sx={{
                        // Estilo sutil del input
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.background.default, 0.4),
                            transition: 'all 0.2s',
                            '&.Mui-focused': {
                                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                        }
                    }}
                />
            </Box>

            {/* Indicadores visuales (puntos) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, height: 12 }}>
                {[...Array(6)].map((_, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: i < code.length 
                                ? 'primary.main' 
                                : alpha(theme.palette.text.disabled, 0.2),
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: i < code.length ? 'scale(1.2)' : 'scale(1)',
                            boxShadow: i < code.length ? `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}` : 'none'
                        }}
                    />
                ))}
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions 
            sx={{ 
                flexDirection: isMobile ? 'column-reverse' : 'row',
                gap: 2,
                px: 4, 
                pb: 4,
                pt: 2,
                justifyContent: 'center'
            }}
        >
            <Button 
                onClick={onClose} 
                color="inherit" 
                variant="text"
                disabled={isLoading} 
                fullWidth={isMobile}
                sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'text.secondary'
                }}
            >
                Cancelar
            </Button>
            
            <Button 
                type="submit" 
                variant="contained" 
                fullWidth={isMobile}
                disabled={code.length !== 6 || isLoading}
                disableElevation
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <VpnKey />}
                sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: theme.shadows[4],
                    minWidth: 140
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