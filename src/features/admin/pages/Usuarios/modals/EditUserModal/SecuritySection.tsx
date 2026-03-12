// src/features/admin/pages/Usuarios/modals/sections/SecuritySection.tsx

import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  VpnKeyOutlined as KeyIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { Box, Button, Chip, Divider, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';
import AdminPasswordReset from '../components/AdminPasswordReset';

interface Props {
  user: UsuarioDto;
  isSelfEditing: boolean;
  onDisable2FA: () => void;
}

const SecuritySection: React.FC<Props> = ({ user, isSelfEditing, onDisable2FA }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold"
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <SecurityIcon fontSize="small" /> Estado de Seguridad
    </Typography>

    <Stack direction="row" spacing={1} mb={user.is_2fa_enabled ? 2 : 1} alignItems="center">
      <Chip
        icon={user.confirmado_email ? <CheckCircleIcon /> : <CancelIcon />}
        label={user.confirmado_email ? 'Email Confirmado' : 'Email Pendiente'}
        color={user.confirmado_email ? 'success' : 'default'}
        size="small" variant="outlined"
      />
      <Chip
        label={user.is_2fa_enabled ? '2FA Activado' : '2FA Desactivado'}
        color={user.is_2fa_enabled ? 'info' : 'default'}
        size="small" variant="outlined"
      />
    </Stack>

    {user.is_2fa_enabled && (
      <Tooltip title={isSelfEditing ? "Usa 'Mi Perfil' para gestionar tu seguridad" : ""}>
        <span>
          <Button variant="outlined" color="warning" startIcon={<SecurityIcon />}
            onClick={onDisable2FA} fullWidth size="small" disabled={isSelfEditing}
            sx={{ borderColor: 'warning.light', color: 'warning.dark', borderRadius: 2 }}
          >
            Resetear Autenticación de Dos Pasos
          </Button>
        </span>
      </Tooltip>
    )}

    <Divider sx={{ my: 2 }} />

    <Typography variant="subtitle2" color="text.secondary" fontWeight="bold"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
    >
      <KeyIcon fontSize="small" /> Restablecer Contraseña
    </Typography>

    <AdminPasswordReset userId={user.id} userName={`${user.nombre} ${user.apellido}`} />
  </Box>
);

export default SecuritySection;