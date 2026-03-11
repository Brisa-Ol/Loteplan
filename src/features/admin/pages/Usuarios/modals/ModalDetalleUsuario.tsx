// src/components/Admin/Usuarios/modals/ModalDetalleUsuario.tsx

import {
  AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ShieldOutlined as ShieldIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo } from 'react';

import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import { BaseModal } from '@/shared';
import { env } from '@/core/config/env'; // 👈 1. Importamos la configuración global


// ============================================================================
// INTERFACES
// ============================================================================
interface ModalDetalleUsuarioProps {
  open: boolean;
  onClose: () => void;
  datosSeleccionados: UsuarioDto | null;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================
const FilaInfo = React.memo(({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number | React.ReactNode, color?: string }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
      <Avatar sx={{
        bgcolor: alpha(color || theme.palette.text.secondary, 0.08),
        color: color || theme.palette.text.secondary,
        width: 34, height: 34,
        borderRadius: 1.5
      }}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 18 } })
          : icon
        }
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const ModalDetalleUsuario: React.FC<ModalDetalleUsuarioProps> = ({ open, onClose, datosSeleccionados }) => {
  const theme = useTheme();

  // --- Helpers de Formateo ---
  const formatearFecha = (str?: string) => {
    if (!str) return 'No registrado';
    // 👈 2. Aplicamos env.defaultLocale en lugar de 'es-AR'
    return new Date(str).toLocaleString(env.defaultLocale, {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    heroPaper: {
      p: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.background.default, 0.5),
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 3,
      position: 'relative',
      overflow: 'hidden'
    },
    securityBox: {
      p: 2.5,
      borderRadius: 3,
      border: '1px dashed',
      borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.action.hover, 0.3)
    },
    sectionTitle: {
      color: 'primary.main',
      fontWeight: 900,
      mb: 1,
      display: 'block',
      letterSpacing: 1
    }
  }), [theme]);

  if (!datosSeleccionados) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Expediente de Usuario"
      subtitle={`Gestión Administrativa - ID #${datosSeleccionados.id}`}
      icon={<BadgeIcon />}
      maxWidth="md"
      headerColor={datosSeleccionados.rol === 'admin' ? 'error' : 'primary'}
      hideConfirmButton
      cancelText="Cerrar Expediente"
    >
      <Stack spacing={3.5}>

        {/* 👤 PERFIL Y ESTADO */}
        <Paper elevation={0} sx={styles.heroPaper}>
          <Avatar
            sx={{
              width: 72, height: 72,
              fontSize: '1.75rem',
              fontWeight: 900,
              bgcolor: datosSeleccionados.activo ? 'primary.main' : theme.palette.text.disabled,
              boxShadow: `0 4px 12px ${alpha(datosSeleccionados.activo ? theme.palette.primary.main : '#000', 0.2)}`
            }}
          >
            {datosSeleccionados.nombre.charAt(0)}{datosSeleccionados.apellido.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: '240px' }}>
            <Typography variant="h5" fontWeight={900}>{datosSeleccionados.nombre} {datosSeleccionados.apellido}</Typography>
            <Typography variant="subtitle2" color="primary.main" fontWeight={800}>@{datosSeleccionados.nombre_usuario}</Typography>

            <Stack direction="row" spacing={1.5} mt={1.5}>
              <Chip
                label={datosSeleccionados.rol.toUpperCase()}
                color={datosSeleccionados.rol === 'admin' ? 'error' : 'info'}
                size="small"
                icon={<AdminIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem' }}
              />
              <Chip
                label={datosSeleccionados.activo ? 'CUENTA ACTIVA' : 'CUENTA INACTIVA'}
                variant="outlined"
                color={datosSeleccionados.activo ? 'success' : 'default'}
                size="small"
                sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem', bgcolor: datosSeleccionados.activo ? alpha(theme.palette.success.main, 0.05) : 'transparent' }}
              />
            </Stack>
          </Box>
        </Paper>

        {/* 📋 INFORMACIÓN TÉCNICA */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>

          {/* COLUMNA A: IDENTIDAD */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={styles.sectionTitle}>Identidad y Contacto</Typography>
            <Stack divider={<Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />}>
              <FilaInfo icon={<BadgeIcon />} label="Documento (DNI)" value={datosSeleccionados.dni} color={theme.palette.primary.main} />
              <FilaInfo icon={<EmailIcon />} label="Correo Electrónico" value={datosSeleccionados.email} color={theme.palette.info.main} />
              <FilaInfo icon={<PhoneIcon />} label="Teléfono de Contacto" value={datosSeleccionados.numero_telefono} color={theme.palette.success.main} />
            </Stack>
          </Box>

          {/* COLUMNA B: SEGURIDAD Y AUDITORÍA */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={styles.sectionTitle}>Seguridad y Trazabilidad</Typography>

            <Box sx={styles.securityBox}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <ShieldIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={900} color="text.secondary">ESTADO DE PROTECCIÓN</Typography>
              </Stack>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">Verificación Email</Typography>
                  <Chip size="small" label={datosSeleccionados.confirmado_email ? "VERIFICADO" : "PENDIENTE"} color={datosSeleccionados.confirmado_email ? "success" : "error"} variant="filled" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900 }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">Seguridad 2FA</Typography>
                  <Chip size="small" label={datosSeleccionados.is_2fa_enabled ? "ACTIVO" : "DESACTIVADO"} color={datosSeleccionados.is_2fa_enabled ? "info" : "default"} sx={{ height: 18, fontSize: '0.55rem', fontWeight: 900 }} />
                </Box>
              </Stack>
            </Box>

            <Box sx={{ mt: 2 }}>
              <FilaInfo icon={<CalendarIcon />} label="Fecha de Registro" value={formatearFecha(datosSeleccionados.fecha_registro)} />
              <FilaInfo icon={<UpdateIcon />} label="Última Sincronización" value={formatearFecha(datosSeleccionados.updatedAt)} />
            </Box>
          </Box>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default ModalDetalleUsuario;