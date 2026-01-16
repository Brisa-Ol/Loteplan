// src/components/layout/AdminLayout/AdminLayout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, IconButton, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import kycService from '@/core/api/services/kyc.service';
import AdminSidebar from '../components/layout/navigation/AdminSidebar';


const AdminLayout: React.FC = () => {
  const theme = useTheme();
  // Detectamos si es móvil para optimizaciones
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ✅ ESTADO: Controla la apertura del menú en móvil
  const [mobileOpen, setMobileOpen] = useState(false);

  // Query para obtener conteo de KYCs pendientes
  const { data: pendingKYC = 0 } = useQuery({
    queryKey: ['adminPendingKYC'],
    queryFn: async () => {
      const solicitudes = await kycService.getPendingVerifications();
      return solicitudes.length;
    },
    refetchInterval: 60000 // Refrescar cada minuto
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* ✅ SIDEBAR INTELIGENTE 
        Le pasamos el estado móvil y la función para cerrarse
      */}
      <AdminSidebar 
        pendingKYC={pendingKYC} 
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      
      {/* Contenedor Principal (Main) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh', 
          overflow: 'auto', // Habilita el scroll interno
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* ✅ BOTÓN DE MENÚ MÓVIL (Solo visible en pantallas pequeñas)
          Como en desktop el sidebar siempre está visible (o colapsado), 
          esto solo es necesario en mobile para "llamar" al sidebar.
        */}
        <Box 
          sx={{ 
            display: { xs: 'flex', md: 'none' }, // Oculto en desktop
            alignItems: 'center',
            p: 2,
            pb: 0
          }}
        >
          <IconButton 
            color="inherit" 
            aria-label="open drawer" 
            edge="start" 
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: 'primary.main' }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Contenido de las páginas */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
            <Outlet />
        </Box>

      </Box>
    </Box>
  );
};

export default AdminLayout;