import React from 'react';
import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material';

// ============================================================================
// COMPONENTE: ADMIN PAGE HEADER
// Header estandarizado para todas las pantallas admin
// ============================================================================

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumbs,
  sx,
}) => {
  return (
    // 1. MEJORA: Margen inferior responsive (menos aire en móvil)
    <Box sx={{ mb: { xs: 3, sm: 4 }, ...sx }}>

      {breadcrumbs && <Box sx={{ mb: 2 }}>{breadcrumbs}</Box>}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={{ xs: 2, sm: 3 }} // 2. MEJORA: Espaciado dinámico entre título y botón
      >
        <Box sx={{ maxWidth: '100%' }}>
          <Typography
            variant="h1"
            // 3. MEJORA: Evita desbordamiento si el título es muy largo en móvil
            sx={{ wordBreak: 'break-word' }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* 4. MEJORA: El contenedor de la acción se expande en móvil para botones grandes */}
        {action && (
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {action}
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default AdminPageHeader;