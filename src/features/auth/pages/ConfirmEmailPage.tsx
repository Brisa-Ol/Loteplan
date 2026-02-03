import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, CircularProgress, Alert, Button, Typography, Fade, Avatar, useTheme, alpha
} from '@mui/material';
import { ErrorOutline, VerifiedUser } from '@mui/icons-material';

import AuthFormContainer from './components/AuthFormContainer/AuthFormContainer';
import AuthService from '@/core/api/services/auth.service';
import type { ApiError } from '@/core/api/httpService';

const ConfirmEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const confirm = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No se proporcionó un token de verificación.');
        return;
      }

      try {
        await AuthService.confirmEmail(token);
        setStatus('success');
      } catch (err: unknown) {
        setStatus('error');
        const apiError = err as ApiError;
        const msg = apiError.message || 'El enlace es inválido o ha expirado.';
        setMessage(msg);
      }
    };

    confirm();
  }, [token]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (status === 'success' && countdown === 0) {
      navigate('/login', { replace: true, state: { message: '¡Cuenta activada! Ya puedes iniciar sesión.' } });
    }
  }, [status, countdown, navigate]);

  let title = "Activación de Cuenta";
  let subtitle = "Estamos verificando tus credenciales...";

  if (status === 'success') {
    title = "¡Bienvenido!";
    subtitle = "Tu cuenta ha sido verificada correctamente.";
  } else if (status === 'error') {
    title = "Error de Activación";
    subtitle = "Hubo un problema al verificar tu cuenta.";
  }

  return (
    <AuthFormContainer title={title} subtitle={subtitle} maxWidth="sm">
      <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" minHeight={300} justifyContent="center">
        
        {status === 'loading' && (
          <Fade in={true}>
            <Box>
              <CircularProgress size={60} thickness={4} sx={{ mb: 4, color: 'primary.main' }} />
              <Typography variant="body1" color="text.secondary">Esto solo tomará unos segundos.</Typography>
            </Box>
          </Fade>
        )}

        {status === 'success' && (
          <Fade in={true}>
            <Box width="100%">
              <Avatar sx={{ width: 80, height: 80, margin: '0 auto', mb: 3, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                <VerifiedUser sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">¡Cuenta Activada!</Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, lineHeight: 1.6 }}>
                Ya tienes acceso completo a la plataforma de inversión.
              </Typography>
              <Alert severity="success" variant="outlined" sx={{ mb: 4, justifyContent: 'center', borderRadius: 2 }}>
                Redirigiendo al login en <strong>{countdown}</strong> segundos...
              </Alert>
              <Button variant="contained" fullWidth size="large" onClick={() => navigate('/login', { replace: true, state: { message: '¡Cuenta activada! Ya puedes iniciar sesión.' } })} sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}>
                Ir al Login Ahora
              </Button>
            </Box>
          </Fade>
        )}

        {status === 'error' && (
          <Fade in={true}>
            <Box width="100%">
              <Avatar sx={{ width: 80, height: 80, margin: '0 auto', mb: 3, bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
                <ErrorOutline sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">Enlace Inválido</Typography>
              <Alert severity="error" sx={{ mb: 4, borderRadius: 2, textAlign: 'left' }}>{message}</Alert>
              <Button variant="outlined" fullWidth size="large" onClick={() => navigate('/login')} sx={{ borderRadius: 2, fontWeight: 700, py: 1.5, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
                Volver al inicio
              </Button>
            </Box>
          </Fade>
        )}
      </Box>
    </AuthFormContainer>
  );
};

export default ConfirmEmailPage;