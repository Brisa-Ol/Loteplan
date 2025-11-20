import React, { useState } from 'react';
import { Box, CssBaseline, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';


const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <CssBaseline />
      
      {/* 1. Sidebar (Navegación Principal del Admin) */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Sidebar 
          open={mobileOpen} 
          onClose={handleDrawerToggle} 
        />
      </Box>

      {/* 2. Área de Contenido Admin */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Botón Hamburguesa (Solo visible en móvil para abrir el sidebar) */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ bgcolor: 'white', boxShadow: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Aquí se renderizan las pantallas de Admin */}
        <Outlet /> 
      </Box>
    </Box>
  );
};

export default AdminLayout;