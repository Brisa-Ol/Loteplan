import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../Footer/Footer';

const ClientLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Navbar Superior Fijo */}
      <Navbar />
      
      {/* Contenido */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* Espaciador para que el Navbar fijo no tape el contenido */}
        <Toolbar /> 
        
        <Box sx={{ mt: 3, mb: 4 }}>
           <Outlet />
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default ClientLayout;