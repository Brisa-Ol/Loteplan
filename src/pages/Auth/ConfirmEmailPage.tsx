import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Paper } from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import AuthService from '../../Services/auth.service';

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
        setMessage('Token no proporcionado.');
        return;
      }

      try {
        await AuthService.confirmEmail(token);
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'No se pudo confirmar el correo.');
      }
    };

    confirm();
  }, [token]);

  // ✅ NUEVO: Redirección automática después del éxito
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (status === 'success' && countdown === 0) {
      navigate('/login', { 
        state: { message: '¡Cuenta activada! Ya puedes iniciar sesión.' } 
      });
    }
  }, [status, countdown, navigate]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" p={2}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: 'center', borderRadius: 2 }}>
        
        {status === 'loading' && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Verificando tu cuenta...</Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleOutline color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>¡Cuenta Activada!</Typography>
            <Typography color="text.secondary" paragraph>
              Tu correo ha sido confirmado exitosamente. Ya puedes acceder a la plataforma.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </Typography>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => navigate('/login', { 
                state: { message: '¡Cuenta activada! Ya puedes iniciar sesión.' } 
              })}
            >
              Ir al Login Ahora
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>Error de Activación</Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {message}
            </Alert>
            <Button variant="outlined" onClick={() => navigate('/login')}>
              Volver al inicio
            </Button>
          </>
        )}

      </Paper>
    </Box>
  );
};

export default ConfirmEmailPage;