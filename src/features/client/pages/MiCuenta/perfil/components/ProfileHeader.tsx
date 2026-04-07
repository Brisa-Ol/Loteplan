// src/pages/client/MiCuenta/Perfil/components/ProfileHeader.tsx

import { Email, Shield, VerifiedUser } from '@mui/icons-material';
import { alpha, Avatar, Box, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

interface Props {
  user: any;
  kycApproved?: boolean;
}

const ProfileHeader: React.FC<Props> = ({ user, kycApproved = false }) => {
  const theme = useTheme();

  // Color del borde del avatar según el estado de KYC
  const avatarBorderColor = kycApproved
    ? theme.palette.success.main
    : theme.palette.warning.main;

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'visible',
        borderRadius: 4,
        width: '100%',
        maxWidth: { xs: '100%', md: 320 },
        position: { md: 'sticky' },
        top: { md: 24 },
      }}
    >
      {/* Banner con patrón decorativo SVG */}
      <Box
        sx={{
          height: 110,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderRadius: '16px 16px 0 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos decorativos superpuestos */}
        <Box sx={{
          position: 'absolute', 
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, ${alpha('#fff', 0.08)} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${alpha('#fff', 0.06)} 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, ${alpha('#fff', 0.05)} 0%, transparent 35%)
          `,
        }} />
        
        {/* Líneas geométricas sutiles */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </Box>

      <CardContent sx={{ pt: 0, pb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Avatar con borde dinámico y sombra */}
        <Box sx={{ position: 'relative', mt: -5.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 92, 
              height: 92,
              bgcolor: 'background.paper',
              color: 'primary.main',
              fontSize: '2.5rem',
              border: `4px solid ${avatarBorderColor}`,
              boxShadow: `0 0 0 3px ${theme.palette.background.paper}, ${theme.shadows[4]}`,
              transition: 'border-color 0.3s ease',
            }}
          >
            {user?.nombre?.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
 {/* Username */}
 
        <Typography variant="h5" fontWeight={800} textAlign="center" sx={{ lineHeight: 1.2 }}>
          {user?.nombre_usuario}
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 0.3 }}>
          {user?.nombre} {user?.apellido}
        </Typography>

       

        {/* Email con ícono */}
        <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5} mb={1.5}>
          <Email sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled" noWrap>
            {user?.email}
          </Typography>
        </Stack>

        {/* Chips de estado dinámicos */}
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1}>
          <Chip
            label={user?.rol === 'admin' ? 'Administrador' : 'Cliente'}
            color="primary"
            size="small"
            variant="filled"
            sx={{ fontWeight: 800 }}
          />
          
          {user?.confirmado_email && (
            <Chip
              icon={<VerifiedUser sx={{ fontSize: '14px !important' }} />}
              label="Verificado"
              color="success"
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 800,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                borderColor: alpha(theme.palette.success.main, 0.3),
              }}
            />
          )}

          {user?.is_2fa_enabled && (
            <Chip
              icon={<Shield sx={{ fontSize: '14px !important' }} />}
              label="2FA"
              color="info"
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 800,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                borderColor: alpha(theme.palette.info.main, 0.3),
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;