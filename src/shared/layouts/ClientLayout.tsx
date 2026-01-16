// src/components/layout/ClientLayout/ClientLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material'; // No necesitas useTheme aquí si solo usas bgcolor default
import ClientNavbar from '../components/layout/navigation/ClientNavbar';
import Footer from '../components/layout/navigation/Footer';

const ClientLayout: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: 'background.default' // Usa token del theme
    }}>
      <ClientNavbar />

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: '100%', 
          py: 3,
          // Scrollbar global se aplica automáticamente aquí
        }}
      >
        <Outlet />
      </Box>

      <Footer />
    </Box>
  );
};

export default ClientLayout;