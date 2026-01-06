import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { GppBad, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    // Si es cliente, lo mandamos a su dashboard, si no, al home
    if (user?.rol === 'cliente') {
      navigate('/client/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ p: 5, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper' }}
      >
        <GppBad sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h4" fontWeight={800} gutterBottom color="text.primary">
          Acceso Restringido
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Lo sentimos, no tienes los permisos necesarios para ver esta página (<strong>/admin/Lotes</strong>).
        </Typography>

        <Typography variant="body2" sx={{ mb: 4, color: 'text.disabled' }}>
          Si crees que esto es un error, contacta al soporte técnico.
        </Typography>

        <Button 
          variant="contained" 
          startIcon={<ArrowBack />} 
          onClick={handleGoBack}
          sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
        >
          Volver a zona segura
        </Button>
      </Paper>
    </Container>
  );
};

export default Unauthorized;