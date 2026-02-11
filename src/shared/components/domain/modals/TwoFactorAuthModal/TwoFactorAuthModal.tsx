import {
  Alert,
  alpha, Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Slide,
  Stack,
  TextField, Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { Security as SecurityIcon } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';

// Transición fluida hacia arriba
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
  description = "Ingresá el código de 6 dígitos de tu aplicación autenticadora para continuar."
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [code, setCode] = useState('');

  useEffect(() => {
    if (open) setCode('');
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length === 6 && !isLoading) {
      onSubmit(code);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(val);
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
      // ✅ Glassmorphism Backdrop
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: alpha(theme.palette.common.black, 0.4),
          }
        }
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2, // 16px
          border: '1px solid',
          borderColor: theme.palette.secondary.main,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          m: 2
        }
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: 'center',
          pt: 5, pb: 2, px: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        {/* Avatar Naranja con Efecto de Seguridad */}
        <Avatar
          sx={{
            width: 72, height: 72,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mb: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 8px 24px -6px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <SecurityIcon sx={{ fontSize: 36 }} />
        </Avatar>

        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '300px', mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
            {description}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 2, px: 4 }}>
          <Stack spacing={4}>

            {error && (
              <Fade in={!!error}>
                <Alert
                  severity="error"
                  variant="outlined"
                  sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: alpha(theme.palette.error.main, 0.02) }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Input OTP Estilizado */}
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
                    letterSpacing: '0.5em',
                    fontSize: '2rem',
                    fontWeight: 800,
                    padding: '20px',
                    fontFamily: 'monospace',
                    color: theme.palette.primary.main
                  }
                }}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5, // 12px
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    '& fieldset': { borderColor: alpha(theme.palette.divider, 0.1) },
                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    '&.Mui-focused fieldset': { borderWidth: '2px' }
                  }
                }}
              />
            </Box>

            {/* Indicadores de Progreso de Código */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pb: 2 }}>
              {[...Array(6)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 12, height: 12,
                    borderRadius: '50%',
                    bgcolor: i < code.length
                      ? theme.palette.primary.main
                      : alpha(theme.palette.text.disabled, 0.2),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: i < code.length ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: i < code.length ? `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}` : 'none'
                  }}
                />
              ))}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: 4, pt: 1,
            flexDirection: isMobile ? 'column-reverse' : 'row',
            gap: 2,
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Button
            onClick={onClose}
            color="inherit"
            variant="text"
            disabled={isLoading}
            fullWidth={isMobile}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
              px: 3
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth={isMobile}
            disabled={code.length !== 6 || isLoading}
            sx={{
              borderRadius: 1, // 8px
              px: 5, py: 1.2,
              textTransform: 'none',
              fontWeight: 700,
              minWidth: 160,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : "Verificar Identidad"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TwoFactorAuthModal;