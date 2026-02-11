// src/components/layout/AdminLayout/AdminLayout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import kycService from '@/core/api/services/kyc.service';
import AdminSidebar from '../components/layout/navigation/AdminSidebar';

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Obtener conteo de KYCs pendientes
  const { data: pendingKYC = 0 } = useQuery({
    queryKey: ['adminPendingKYC'],
    queryFn: async () => (await kycService.getPendingVerifications()).length,
    refetchInterval: 60000
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      <AdminSidebar
        pendingKYC={pendingKYC}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Botón Menú Móvil */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            p: 2,
            pb: 0
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, color: 'primary.main' }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Contenido */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;