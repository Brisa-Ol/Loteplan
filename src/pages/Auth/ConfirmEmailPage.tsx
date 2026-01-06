import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  CircularProgress, 
  Alert, 
  Button, 
  Typography, 
  Card, 
  CardContent 
} from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import AuthService from '../../services/auth.service';

const ConfirmEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
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
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'El enlace es inválido o ha expirado.');
      }
    };

    confirm();
  }, [token]);

  // Redirección automática
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (status === 'success' && countdown === 0) {
      navigate('/login', { 
        replace: true,
        state: { message: '¡Cuenta activada! Ya puedes iniciar sesión.' } 
      });
    }
  }, [status, countdown, navigate]);

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh" 
      p={3}
      bgcolor="background.default" // Usa el color de fondo del tema
    >
      <Card sx={{ maxWidth: 450, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          
          {status === 'loading' && (
            <Box py={4}>
              <CircularProgress size={60} thickness={4} color="primary" sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight={500}>
                Verificando tu cuenta...
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <>
              <CheckCircleOutline color="success" sx={{ fontSize: 80, mb: 2 }} />
              
              <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
                ¡Cuenta Activada!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
                Tu correo ha sido confirmado exitosamente. Ahora tienes acceso completo a la plataforma.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3, justifyContent: 'center' }}>
                Redirigiendo en <strong>{countdown}</strong> segundo{countdown !== 1 ? 's' : ''}...
              </Alert>
              
              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                onClick={() => navigate('/login', { 
                  replace: true,
                  state: { message: '¡Cuenta activada! Ya puedes iniciar sesión.' } 
                })}
              >
                Ir al Login Ahora
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorOutline color="error" sx={{ fontSize: 80, mb: 2 }} />
              
              <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
                Error de Activación
              </Typography>
              
              <Alert severity="error" sx={{ mb: 4, width: '100%', textAlign: 'left' }}>
                {message}
              </Alert>
              
              <Button 
                variant="outlined" 
                fullWidth 
                size="large"
                onClick={() => navigate('/login')}
              >
                Volver al inicio
              </Button>
            </>
          )}

        </CardContent>
      </Card>
    </Box>
  );
};

export default ConfirmEmailPage;