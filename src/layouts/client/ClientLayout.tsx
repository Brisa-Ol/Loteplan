// src/layouts/client/ClientLayout.tsx

import { Box } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

import Footer from '../Footer';
import { NAVBAR_HEIGHT } from '../useNavbarMenu';
import ClientNavbar from './ClientNavbar';

const ClientLayout: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <ClientNavbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          py: { xs: 2, sm: 2.5, md: 3 },
          px: { xs: 0, sm: 0 },
          minHeight: {
            xs: `calc(100vh - ${NAVBAR_HEIGHT.mobile}px)`,
            md: `calc(100vh - ${NAVBAR_HEIGHT.desktop}px)`,
          },
        }}
      >
        <Outlet />
      </Box>

      <Footer />
    </Box>
  );
};

export default ClientLayout;