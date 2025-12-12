// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../../context/AuthContext';


const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    // Redirige al dashboard correcto según el rol
    const destination = user?.rol === 'admin' ? '/admin/dashboard' : '/mi-cuenta/perfil';
    navigate(destination);
  };

  const handleGoBack = () => {
    navigate(-1); // Vuelve a la página anterior
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'error.light',
            mb: 3,
          }}
        >
          <BlockIcon sx={{ fontSize: 60, color: 'white' }} />
        </Box>

        <Typography component="h1" variant="h4" gutterBottom>
          Acceso Denegado
        </Typography>

        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 3 }}>
          <Typography variant="body1">
            No tienes los permisos necesarios para acceder a esta página.
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Tu rol actual: <strong>{user.rol === 'admin' ? 'Administrador' : 'Cliente'}</strong>
            </Typography>
          )}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoBack}
          >
            Volver Atrás
          </Button>
          <Button
            variant="contained"
            fullWidth
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
          >
            Ir a Mi Cuenta
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;