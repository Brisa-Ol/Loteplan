// src/features/admin/pages/Inversiones/components/DetalleInversionModal.tsx

import {
  Business,
  CalendarToday,
  OpenInNew as OpenIcon,
  Person,
  ReceiptLong,
  AlternateEmail,
  PieChart // 🆕 Icono nuevo
} from '@mui/icons-material';
import {
  Alert, // 🆕 Importado para avisos
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { InversionDto } from '../../../../../core/types/dto/inversion.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  inversion: InversionDto | null;
  userName?: string;
  userEmail?: string;
  projectName?: string;
}

const DetalleInversionModal: React.FC<Props> = ({
  open, onClose, inversion, userName, userEmail, projectName
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  if (!inversion) return null;

  const getStatusColor = (status: InversionDto['estado']): any => {
    switch (status) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'fallido': return 'error';
      case 'reembolsado': return 'info';
      default: return 'primary';
    }
  };

  const statusColor = getStatusColor(inversion.estado);
  const themeColorMain = theme.palette[statusColor as 'success' | 'warning' | 'error' | 'info' | 'primary'].main;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No registrada';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // 🆕 Cálculos de participación
  const montoInvertido = Number(inversion.monto) || 0;
  const montoTotalProyecto = Number(inversion.proyectoInvertido?.monto_inversion) || 0;
  const porcentajeParticipacion = montoTotalProyecto > 0 
    ? ((montoInvertido / montoTotalProyecto) * 100).toFixed(2) 
    : 0;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Detalle de Inversión`}
      subtitle={`Referencia interna: #INV-${inversion.id}`}
      icon={<ReceiptLong />}
      headerColor={statusColor}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar ventana"
      headerExtra={
        <Chip label={inversion.estado.toUpperCase()} color={statusColor} sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }} />
      }
    >
      <Stack spacing={3}>

        {/* 🆕 ALERTAS CONTEXTUALES DE ESTADO */}
        {inversion.estado === 'pendiente' && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Esta inversión está a la espera de confirmación de fondos o validación 2FA por parte del usuario.
            </Alert>
        )}
        {inversion.estado === 'fallido' && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                La operación fue rechazada o el tiempo de pago expiró.
            </Alert>
        )}
        {inversion.estado === 'reembolsado' && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
                El capital ha sido devuelto exitosamente al inversor.
            </Alert>
        )}

        {/* SECCIÓN 1: CAPITAL DE LA OPERACIÓN (Enriquecido) */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Paper
                elevation={0}
                sx={{
                    flex: 2, p: 3, borderRadius: 3, border: '1px solid',
                    borderColor: alpha(themeColorMain, 0.2), bgcolor: alpha(themeColorMain, 0.02),
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'
                }}
            >
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>
                    Monto Comprometido
                </Typography>
                <Typography variant="h2" fontWeight={900} color={`${statusColor}.main`} sx={{ my: 1 }}>
                    ${montoInvertido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
            </Paper>

            {/* 🆕 Tarjeta de Participación */}
            {montoTotalProyecto > 0 && (
                <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <PieChart color="action" sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                        {porcentajeParticipacion}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textAlign="center">
                        DEL TOTAL DEL PROYECTO
                    </Typography>
                </Paper>
            )}
        </Stack>

        {/* COLUMNAS: USUARIO Y PROYECTO */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>

          {/* TARJETA INVERSOR */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Box sx={{ p: 0.5, bgcolor: 'primary.light', borderRadius: 1, display: 'flex', color: 'primary.main' }}>
                <Person fontSize="small" />
              </Box>
              <Typography variant="subtitle2" fontWeight={800}>DATOS DEL INVERSOR</Typography>
            </Stack>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>USUARIO</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <AlternateEmail sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                        {inversion.inversor?.nombre_usuario || 'Sin username'}
                    </Typography>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>NOMBRE COMPLETO</Typography>
                <Typography variant="body2" fontWeight={500}>
                    {userName || `${inversion.inversor?.nombre} ${inversion.inversor?.apellido}` || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>CONTACTO</Typography>
                <Typography variant="body2" color="text.primary">{userEmail || inversion.inversor?.email || '-'}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* TARJETA PROYECTO (Enriquecida) */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Box sx={{ p: 0.5, bgcolor: 'secondary.light', borderRadius: 1, display: 'flex', color: 'secondary.main' }}>
                <Business fontSize="small" />
              </Box>
              <Typography variant="subtitle2" fontWeight={800}>PROYECTO DESTINO</Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>DESARROLLO</Typography>
                <Typography variant="body1" fontWeight={700}>
                  {inversion.proyectoInvertido?.nombre_proyecto || projectName || 'Desconocido'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>DETALLES</Typography>
                <Stack direction="row" spacing={1}>
                    <Chip 
                        label={inversion.proyectoInvertido?.tipo_inversion?.toUpperCase() || 'S/D'} 
                        size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                    {/* 🆕 Estado actual del proyecto */}
                    {inversion.proyectoInvertido?.estado_proyecto && (
                        <Chip 
                            label={inversion.proyectoInvertido.estado_proyecto.toUpperCase()} 
                            size="small" color="default" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                    )}
                </Stack>
              </Box>
              
              <Button
                variant="contained" fullWidth size="small" startIcon={<OpenIcon />}
                onClick={() => navigate(`/admin/proyectos?highlight=${inversion.id_proyecto}`)}
                sx={{ borderRadius: 2, mt: 1, fontWeight: 700, textTransform: 'none' }}
              >
                Gestionar Proyecto
              </Button>
            </Stack>
          </Paper>
        </Stack>

        {/* SECCIÓN 4: CRONOLOGÍA */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <CalendarToday color="action" sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={800}>CRONOLOGÍA DE LA INVERSIÓN</Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>REGISTRO INICIAL</Typography>
              <Typography variant="body2" fontWeight={600} display="block">
                {formatDate(inversion.fecha_inversion || (inversion as any).createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ÚLTIMA ACTIVIDAD</Typography>
              <Typography variant="body2" fontWeight={600} display="block">
                {formatDate((inversion as any).updatedAt)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

      </Stack>
    </BaseModal>
  );
};

export default DetalleInversionModal;