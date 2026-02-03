import { useAuth } from '@/core/context/AuthContext';
import { ArrowBack, GppBad } from '@mui/icons-material';
import { Button, Container, Paper, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    // Si es cliente, lo mandamos a su dashboard, si no (o admin), al home público o su panel
    if (user?.rol === 'cliente') {
      navigate('/client/dashboard');
    } else {
      // Por defecto para admins o users raros
      navigate(user?.rol === 'admin' ? '/admin/dashboard' : '/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper' }}>
        <GppBad sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={800} gutterBottom color="text.primary">Acceso Restringido</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Lo sentimos, no tienes los permisos necesarios para ver esta página.
        </Typography>
        <Button variant="contained" startIcon={<ArrowBack />} onClick={handleGoBack} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
          Volver a zona segura
        </Button>
      </Paper>
    </Container>
  );
};

export default Unauthorized;