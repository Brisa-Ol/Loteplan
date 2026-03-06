// src/layouts/client/ClientLayout.tsx

import { Box } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

import Footer from '../Footer';
import ClientNavbar from './ClientNavbar';


const ClientLayout: React.FC = () => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <ClientNavbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          py: 3,
        }}
      >
        <Outlet />
      </Box>

      <Footer />
    </Box>
  );
};

export default ClientLayout;