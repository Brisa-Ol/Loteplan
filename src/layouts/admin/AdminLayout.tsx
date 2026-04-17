// src/layouts/admin/AdminLayout.tsx

import { Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import kycService from '@/core/api/services/kyc.service';
import { env } from '@/core/config/env';
import AdminSidebar, { DRAWER_WIDTH, NAVBAR_HEIGHT } from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: pendingKYC = 0 } = useQuery({
    queryKey: ['adminPendingKYC'],
    queryFn: async () => (await kycService.getPendingVerifications()).length,
    refetchInterval: env.queryRefetchInterval,
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Topbar móvil (solo xs/sm) ─────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${NAVBAR_HEIGHT.mobile}px !important`,
            px: 2,
            gap: 2,
          }}
        >
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ color: 'primary.main' }}
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src="/navbar/nav.png"
            alt="Logo"
            sx={{ height: 32, maxWidth: 140, objectFit: 'contain' }}
          />

          {/* Espacio flexible para empujar contenido a la derecha si se necesita */}
          <Box sx={{ flex: 1 }} />
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <AdminSidebar
        pendingKYC={pendingKYC}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Área de contenido principal ──────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',

          // En móvil: desplazar el contenido debajo del AppBar fijo
          mt: { xs: `${NAVBAR_HEIGHT.mobile}px`, md: 0 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 2.5, md: 3 },
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;