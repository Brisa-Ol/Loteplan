import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from './AdminSidebar';
import kycService from '../../../Services/kyc.service';



const AdminLayout: React.FC = () => {
  // Query para obtener conteo de KYCs pendientes
  const { data: pendingKYC = 0 } = useQuery({
    queryKey: ['adminPendingKYC'],
    queryFn: async () => {
      // El servicio devuelve KycDTO[], usamos .length para el badge
      const solicitudes = await kycService.getPendingVerifications();
      return solicitudes.length;
    },
    refetchInterval: 60000 // Refrescar cada minuto
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar pendingKYC={pendingKYC} />
      
      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: 'background.default', // Usar token del tema mejor que color fijo
          minHeight: '100vh',
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;