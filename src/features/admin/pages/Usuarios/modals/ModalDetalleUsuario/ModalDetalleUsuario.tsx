// src/features/admin/pages/Usuarios/modals/ModalDetalleUsuario.tsx

import { env } from '@/core/config/env';
import type { UsuarioDto } from '@/core/types/usuario.dto';
import { BaseModal } from '@/shared';
import {
  AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ShieldOutlined as ShieldIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Chip, Divider, Paper,
  Stack, Typography, useTheme,
} from '@mui/material';
import React, { memo, useMemo } from 'react';

// ── FilaInfo ──────────────────────────────────────────────────────────────────
const FilaInfo = memo(({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; color?: string;
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
      <Avatar sx={{ bgcolor: alpha(color || theme.palette.text.secondary, 0.08), color: color || theme.palette.text.secondary, width: 34, height: 34, borderRadius: 1.5 }}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 18 } }) : icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5, lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || '---'}
        </Typography>
      </Box>
    </Box>
  );
});

// ── IdentityColumn ────────────────────────────────────────────────────────────
const IdentityColumn: React.FC<{ u: UsuarioDto }> = ({ u }) => {
  const theme = useTheme();
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, mb: 1, display: 'block', letterSpacing: 1 }}>
        Identidad y Contacto
      </Typography>
      <Stack divider={<Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />}>
        <FilaInfo icon={<BadgeIcon />} label="Documento (DNI)" value={u.dni} color={theme.palette.primary.main} />
        <FilaInfo icon={<EmailIcon />} label="Correo Electrónico" value={u.email} color={theme.palette.info.main} />
        <FilaInfo icon={<PhoneIcon />} label="Teléfono de Contacto" value={u.numero_telefono} color={theme.palette.success.main} />
      </Stack>
    </Box>
  );
};

// ── SecurityColumn ────────────────────────────────────────────────────────────
const SecurityColumn: React.FC<{ u: UsuarioDto; formatearFecha: (s?: string) => string }> = ({ u, formatearFecha }) => {
  const theme = useTheme();
  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, mb: 1, display: 'block', letterSpacing: 1 }}>
        Seguridad y Trazabilidad
      </Typography>

      <Box sx={{ p: 2.5, borderRadius: 3, border: '1px dashed', borderColor: theme.palette.divider, bgcolor: alpha(theme.palette.action.hover, 0.3) }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <ShieldIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={900} color="text.secondary">ESTADO DE PROTECCIÓN</Typography>
        </Stack>
        <Stack spacing={1.5}>
          {[
            { label: 'Verificación Email', value: u.confirmado_email ? 'VERIFICADO' : 'PENDIENTE', color: u.confirmado_email ? 'success' : 'error' },
            { label: 'Seguridad 2FA', value: u.is_2fa_enabled ? 'ACTIVO' : 'DESACTIVADO', color: u.is_2fa_enabled ? 'info' : 'default' },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
              <Chip size="small" label={value} color={color as any} sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900 }} />
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        <FilaInfo icon={<CalendarIcon />} label="Fecha de Registro" value={formatearFecha(u.fecha_registro)} />
        <FilaInfo icon={<UpdateIcon />} label="Última Sincronización" value={formatearFecha(u.updatedAt)} />
      </Box>
    </Box>
  );
};

// ── ModalDetalleUsuario ───────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; datosSeleccionados: UsuarioDto | null; }

const ModalDetalleUsuario: React.FC<Props> = ({ open, onClose, datosSeleccionados }) => {
  const theme = useTheme();

  const formatearFecha = (str?: string) =>
    str ? new Date(str).toLocaleString(env.defaultLocale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No registrado';

  const heroPaperSx = useMemo(() => ({
    p: 3, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider,
    bgcolor: alpha(theme.palette.background.default, 0.5),
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3,
    position: 'relative', overflow: 'hidden',
  }), [theme]);

  if (!datosSeleccionados) return null;
  const u = datosSeleccionados;

  return (
    <BaseModal
      open={open} onClose={onClose}
      title="Expediente de Usuario"
      subtitle={`Gestión Administrativa - ID #${u.id}`}
      icon={<BadgeIcon />} maxWidth="md"
      headerColor={u.rol === 'admin' ? 'error' : 'primary'}
      hideConfirmButton cancelText="Cerrar Expediente"
    >
      <Stack spacing={3.5}>

        {/* Hero */}
        <Paper elevation={0} sx={heroPaperSx}>
          <Avatar sx={{
            width: 72, height: 72, fontSize: '1.75rem', fontWeight: 900,
            bgcolor: u.activo ? 'primary.main' : theme.palette.text.disabled,
            boxShadow: `0 4px 12px ${alpha(u.activo ? theme.palette.primary.main : '#000', 0.2)}`,
          }}>
            {u.nombre.charAt(0)}{u.apellido.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: '240px' }}>
            <Typography variant="h5" fontWeight={900}>{u.nombre} {u.apellido}</Typography>
            <Typography variant="subtitle2" color="primary.main" fontWeight={800}>@{u.nombre_usuario}</Typography>
            <Stack direction="row" spacing={1.5} mt={1.5}>
              <Chip label={u.rol.toUpperCase()} color={u.rol === 'admin' ? 'error' : 'info'} size="small"
                icon={<AdminIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem' }}
              />
              <Chip label={u.activo ? 'CUENTA ACTIVA' : 'CUENTA INACTIVA'} variant="outlined"
                color={u.activo ? 'success' : 'default'} size="small"
                sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem', bgcolor: u.activo ? alpha(theme.palette.success.main, 0.05) : 'transparent' }}
              />
            </Stack>
          </Box>
        </Paper>

        {/* Columnas */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          <IdentityColumn u={u} />
          <SecurityColumn u={u} formatearFecha={formatearFecha} />
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default ModalDetalleUsuario;