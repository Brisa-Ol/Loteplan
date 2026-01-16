import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, CircularProgress, 
  Box, Stack, useTheme, useMediaQuery, alpha
} from '@mui/material';
import { VpnKey } from '@mui/icons-material';

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
  description = "Tu cuenta tiene activada la autenticación de dos factores. Ingresa el código de 6 dígitos de tu aplicación."
}) => {
  const theme = useTheme();
  // ✅ Usamos la detección móvil estándar para coherencia con tus otros modales
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [code, setCode] = useState('');

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
      // Si está cargando, bloqueamos el cierre
      onClose={isLoading ? undefined : onClose} 
      maxWidth="xs" 
      fullWidth
      // ✅ LIMPIEZA: Eliminamos PaperProps manuales.
      // El theme ya define borderRadius (12px/8px) y márgenes correctos.
    >
      <DialogTitle 
        sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2,
            // ✅ Fondo sutil en el header para darle importancia (opcional, pero consistente)
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <VpnKey color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" component="span" fontWeight={700}>
            {title}
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}> {/* Un poco de padding top extra para separar del header */}
          <Stack spacing={3}>
            
            <Typography variant="body1" color="text.secondary">
                {description}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
                </Alert>
            )}

            {/* Input Grande tipo OTP */}
            <TextField
                autoFocus
                fullWidth
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
                    maxLength: 6,
                    style: { 
                        textAlign: 'center', 
                        letterSpacing: '0.5em', // Espaciado amplio para números
                        fontSize: '1.5rem', 
                        fontWeight: 700,
                        padding: '16px' 
                    }
                }}
                disabled={isLoading}
                error={!!error}
                // Usamos el color primario para el foco
                color="primary"
            />

            {/* Indicadores visuales (puntos) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, pb: 1 }}>
                {[...Array(6)].map((_, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            // ✅ Usamos colores del theme en lugar de 'grey.300' hardcodeado
                            bgcolor: i < code.length 
                                ? 'primary.main' 
                                : alpha(theme.palette.text.disabled, 0.3),
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: i < code.length ? 'scale(1.2)' : 'scale(1)'
                        }}
                    />
                ))}
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions 
            sx={{ 
                // ✅ Layout responsivo de botones igual que en LogoutDialog
                flexDirection: isMobile ? 'column-reverse' : 'row',
                gap: 2,
                px: 3, 
                pb: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.default, 0.5)
            }}
        >
            <Button 
                onClick={onClose} 
                color="inherit" 
                disabled={isLoading} 
                fullWidth={isMobile}
                // El theme ya pone el borderRadius y fontWeight
            >
                Cancelar
            </Button>
            
            <Button 
                type="submit" 
                variant="contained" 
                fullWidth={isMobile}
                disabled={code.length !== 6 || isLoading}
                disableElevation
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ px: 4 }}
            >
                {isLoading ? "Verificando..." : "Verificar"}
            </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TwoFactorAuthModal;