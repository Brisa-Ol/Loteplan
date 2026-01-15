import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import ClientNavbar from '../components/layout/navigation/ClientNavbar'; // Ajusta la ruta
import Footer from '../components/layout/navigation/Footer';

const ClientLayout: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: 'background.default' 
    }}>
      {/* Navbar fijo arriba */}
      <ClientNavbar />

      {/* Contenido Principal */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: '100%', 
          py: 3,
          // Aquí aplicamos el scrollbar global automáticamente gracias al Theme
        }}
      >
        <Outlet />
      </Box>

      {/* Footer al final */}
      <Footer />
    </Box>
  );
};

export default ClientLayout;