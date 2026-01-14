// src/components/layout/AdminLayout/AdminLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import kycService from '@/core/api/services/kyc.service';
import AdminSidebar from '../components/layout/navigation/AdminSidebar';


const AdminLayout: React.FC = () => {
  const theme = useTheme();

  // Query para obtener conteo de KYCs pendientes
  const { data: pendingKYC = 0 } = useQuery({
    queryKey: ['adminPendingKYC'],
    queryFn: async () => {
      const solicitudes = await kycService.getPendingVerifications();
      return solicitudes.length;
    },
    refetchInterval: 60000 // Refrescar cada minuto
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      
      {/* Sidebar con el conteo de notificaciones */}
      <AdminSidebar pendingKYC={pendingKYC} />
      
      {/* Contenedor Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh', // Ocupa toda la altura
          overflow: 'auto', // Scroll interno solo para el contenido
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
          // Transición suave si el sidebar colapsa
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Renderizado de las páginas hijas */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;