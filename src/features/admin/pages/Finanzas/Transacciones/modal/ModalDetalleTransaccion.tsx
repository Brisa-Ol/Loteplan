// src/pages/Admin/Transacciones/modal/ModalDetalleTransaccion.tsx

import type { TransaccionDto } from '@/core/types/transaccion.dto';
import { BaseModal } from '@/shared/components/domain';
import {
  AttachMoney,
  Bolt,
  Business,
  Category,
  CreditCard,
  Error as ErrorIcon,
  Event,
  Person
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useMemo } from 'react';

// ============================================================================
// INTERFACES
// ============================================================================
interface Props {
  open: boolean;
  onClose: () => void;
  transaccion: TransaccionDto | null;
  onForceConfirm: (id: number) => void;
  isConfirming: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const ModalDetalleTransaccion: React.FC<Props> = ({
  open,
  onClose,
  transaccion,
  onForceConfirm,
  isConfirming
}) => {
  const theme = useTheme();

  // --- Helpers & Logic ---
  const isPendingOrFailed = useMemo(() =>
    ['pendiente', 'fallido'].includes(transaccion?.estado_transaccion || ''),
    [transaccion]);

  const usuarioNombre = useMemo(() =>
    transaccion?.usuario ? `${transaccion.usuario.nombre} ${transaccion.usuario.apellido}` : `Usuario ID: ${transaccion?.id_usuario}`,
    [transaccion]);

  const statusColor = useMemo(() => {
    if (!transaccion) return 'primary';
    switch (transaccion.estado_transaccion) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'fallido':
      case 'rechazado_por_capacidad':
      case 'rechazado_proyecto_cerrado':
      case 'expirado': return 'error';
      case 'reembolsado':
      case 'revertido': return 'info';
      default: return 'primary';
    }
  }, [transaccion]);

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    sectionTitle: {
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontWeight: 800,
      fontSize: '0.7rem',
      color: 'primary.main',
      mb: 2
    },
    infoPaper: {
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: alpha(theme.palette.action.active, 0.02),
      display: 'flex',
      alignItems: 'center',
      gap: 2
    },
    adminZone: {
      bgcolor: alpha(theme.palette.warning.main, 0.04),
      p: 2.5,
      borderRadius: 3,
      border: '1px dashed',
      borderColor: theme.palette.warning.main,
      mt: 3
    }
  }), [theme]);

  if (!transaccion) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Transacción #${transaccion.id}`}
      subtitle={`Ref. Pasarela: ${transaccion.pagoPasarela?.id_transaccion_pasarela || transaccion.id_pago_pasarela || 'N/A'}`}
      icon={<CreditCard />}
      headerColor={statusColor as any}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip
          label={transaccion.estado_transaccion.toUpperCase().replace(/_/g, ' ')}
          color={statusColor as any}
          sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }}
        />
      }
    >
      <Stack spacing={3}>
        {/* ALERTA DE ERROR */}
        {transaccion.error_detalle && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={800}>Detalle del Fallo:</Typography>
            <Typography variant="body2">{transaccion.error_detalle}</Typography>
          </Alert>
        )}

        {/* CUERPO DEL DETALLE */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>

          {/* COLUMNA IZQUIERDA: FINANZAS */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={styles.sectionTitle}>Datos Financieros</Typography>
            <Stack spacing={2.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                  <AttachMoney />
                </Avatar>
                <Typography variant="h4" fontWeight={900} color="text.primary">
                  {Number(transaccion.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </Typography>
              </Box>

              <Paper elevation={0} sx={{ ...styles.infoPaper, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Category fontSize="small" color="disabled" />
                  <Typography variant="caption" fontWeight={800} color="text.secondary">TIPO DE OPERACIÓN</Typography>
                </Stack>
                <Typography variant="body1" fontWeight={700} sx={{ pl: 3.5 }}>
                  {transaccion.tipo_transaccion === 'pago_suscripcion_inicial' ? 'Suscripción Inicial' :
                    transaccion.tipo_transaccion === 'directo' ? 'Inversión Directa' :
                      transaccion.tipo_transaccion === 'mensual' ? 'Cuota Mensual' :
                        transaccion.tipo_transaccion.toUpperCase()}
                </Typography>
              </Paper>

              <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1 }}>
                <Event color="disabled" fontSize="small" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {transaccion.fecha_transaccion
                    ? format(new Date(transaccion.fecha_transaccion), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })
                    : 'Fecha no registrada'}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* COLUMNA DERECHA: CONTEXTO */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={styles.sectionTitle}>Usuario y Contexto</Typography>
            <Stack spacing={2}>
              <Paper elevation={0} sx={styles.infoPaper}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>
                  {transaccion.usuario?.nombre?.[0] || <Person />}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>USUARIO</Typography>
                  <Typography variant="body2" fontWeight={700} noWrap>{usuarioNombre}</Typography>
                  <Typography variant="caption" color="text.disabled" display="block" noWrap>{transaccion.usuario?.email}</Typography>
                </Box>
              </Paper>

              {transaccion.id_proyecto && (
                <Paper elevation={0} sx={styles.infoPaper}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>PROYECTO</Typography>
                    <Typography variant="body2" fontWeight={700}>{transaccion.proyectoTransaccion?.nombre_proyecto || `ID: ${transaccion.id_proyecto}`}</Typography>
                    <Chip label={transaccion.proyectoTransaccion?.estado_proyecto || 'S/D'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', mt: 0.5, fontWeight: 700 }} />
                  </Box>
                </Paper>
              )}

              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5} fontWeight={800}>DOCUMENTOS RELACIONADOS</Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {transaccion.id_inversion && <Chip label={`Inversión #${transaccion.id_inversion}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
                  {transaccion.id_suscripcion && <Chip label={`Suscripción #${transaccion.id_suscripcion}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
                  {transaccion.id_pago_mensual && <Chip label={`Cuota #${transaccion.id_pago_mensual}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* ZONA DE ADMINISTRACIÓN CRÍTICA */}
        {isPendingOrFailed && (
          <Box sx={styles.adminZone}>
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <Bolt color="warning" />
              <Typography variant="subtitle2" color="warning.dark" fontWeight={900}>Acción Administrativa Requerida</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" component="p" mb={2}>
              Si el pago impactó en la cuenta bancaria/pasarela pero el sistema sigue en estado <b>{transaccion.estado_transaccion}</b>, puede forzar la confirmación manual para impactar los saldos.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              onClick={() => onForceConfirm(transaccion.id)}
              disabled={isConfirming}
              fullWidth
              sx={{ borderRadius: 2, fontWeight: 800, py: 1.2, boxShadow: theme.shadows[2] }}
            >
              {isConfirming ? 'Procesando Confirmación...' : 'Confirmar Impacto de Pago Manual'}
            </Button>
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default ModalDetalleTransaccion;