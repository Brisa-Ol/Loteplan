// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Stack,
  alpha // Utilidad para crear transparencias con los colores del theme
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Agregamos icono para "Volver"

// Importamos componentes comunes y contexto
import { useAuth } from '../../context/AuthContext';
import { PageContainer } from '../../components/common/PageContainer/PageContainer';


const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    // Redirige al dashboard correcto según el rol
    const destination = user?.rol === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    // Nota: Ajusté '/mi-cuenta/perfil' a '/client/dashboard' para consistencia con tu Login, 
    // pero cámbialo si tu ruta es distinta.
    navigate(destination);
  };

  const handleGoBack = () => {
    navigate(-1); // Vuelve a la página anterior
  };

  return (
    <PageContainer maxWidth="sm">
      <Card 
        sx={{ 
          maxWidth: 500, 
          width: '100%', 
          textAlign: 'center',
          // Desactivamos la animación de "salto" del hover del theme para esta página estática
          '&:hover': { transform: 'none' } 
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          
          {/* Círculo del Icono */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              // Usamos el color de error del theme con transparencia para el fondo
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              color: 'error.main',
              mx: 'auto',
              mb: 3,
            }}
          >
            <BlockIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h3" fontWeight={700} gutterBottom color="text.primary">
            Acceso Denegado
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Lo sentimos, no tienes los permisos necesarios para ver esta página.
          </Typography>

          <Alert 
            severity="error" 
            variant="outlined" // Variante más sutil y elegante
            sx={{ 
              mt: 2, 
              mb: 4, 
              textAlign: 'left', 
              border: 1, // Asegura que se vea el borde definido por el theme
              borderColor: 'error.main'
            }}
          >
            <Typography variant="body2">
              <strong>Razón:</strong> Permisos insuficientes.
            </Typography>
            {user && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Rol actual detectado: <strong>{user.rol === 'admin' ? 'Administrador' : 'Cliente'}</strong>
              </Typography>
            )}
          </Alert>

          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              color="inherit" // Mantiene un color neutro para la acción secundaria
            >
              Volver Atrás
            </Button>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              // El theme aplicará automáticamente el color primary (naranja)
            >
              Ir al Inicio
            </Button>
          </Stack>

        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Unauthorized;