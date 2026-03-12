// src/features/admin/pages/Inversiones/components/DetalleInversionModal.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Business,
  CalendarToday,
  OpenInNew as OpenIcon,
  Person,
  ReceiptLong,
  AlternateEmail,
  PieChart,
  Update as UpdateIcon
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

import type { InversionDto } from '../../../../../core/types/inversion.dto';
import { BaseModal } from '@/shared';



interface DetalleInversionModalProps {
  open: boolean;
  onClose: () => void;
  inversion: InversionDto | null;
  userName?: string;
  userEmail?: string;
  projectName?: string;
}

const DetalleInversionModal: React.FC<DetalleInversionModalProps> = ({
  open, onClose, inversion, userName, userEmail, projectName
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  if (!inversion) return null;

  // Lógica de colores por estado
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

  // Cálculos de participación sobre el total del proyecto
  const montoInvertido = Number(inversion.monto) || 0;
  const montoTotalProyecto = Number(inversion.proyectoInvertido?.monto_inversion) || 0;
  const porcentajeParticipacion = montoTotalProyecto > 0 
    ? ((montoInvertido / montoTotalProyecto) * 100).toFixed(2) 
    : 0;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Expediente de Inversión"
      subtitle={`Referencia técnica: #INV-${inversion.id}`}
      icon={<ReceiptLong />}
      headerColor={statusColor}
      maxWidth="md"
      headerExtra={
        <Chip 
          label={inversion.estado.toUpperCase()} 
          color={statusColor} 
          sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }} 
        />
      }
    >
      <Stack spacing={3}>
        
        {/* 🚨 ALERTAS CONTEXTUALES SEGÚN ESTADO */}
        {inversion.estado === 'pendiente' && (
          <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 500 }}>
            Operación en espera: Requiere confirmación de fondos o validación 2FA.
          </Alert>
        )}
        {inversion.estado === 'fallido' && (
          <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 500 }}>
            Operación rechazada: Los fondos no fueron acreditados o el tiempo de espera expiró.
          </Alert>
        )}
        {inversion.estado === 'reembolsado' && (
          <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 500 }}>
            Capital devuelto: Los fondos han sido reintegrados a la cuenta del inversor.
          </Alert>
        )}

        {/* 💰 SECCIÓN: CAPITAL Y PARTICIPACIÓN */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              flex: 2, p: 3, borderRadius: 3, 
              borderColor: alpha(themeColorMain, 0.3), 
              bgcolor: alpha(themeColorMain, 0.03),
              display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'
            }}
          >
            <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1.5}>
              MONTO TOTAL DE LA OPERACIÓN
            </Typography>
            <Typography variant="h2" fontWeight={900} color={`${statusColor}.main`} sx={{ my: 0.5 }}>
              ${montoInvertido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="text.disabled" fontWeight={700}>
              DIVISA: ARS (PESOS ARGENTINOS)
            </Typography>
          </Paper>

          {montoTotalProyecto > 0 && (
            <Paper 
              variant="outlined" 
              sx={{ 
                flex: 1, p: 3, borderRadius: 3, 
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
              }}
            >
              <PieChart color="action" sx={{ fontSize: 28, mb: 1, opacity: 0.6 }} />
              <Typography variant="h4" fontWeight={900} color="text.primary">
                {porcentajeParticipacion}%
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={800} textAlign="center" sx={{ lineHeight: 1.2 }}>
                PARTICIPACIÓN EN EL PROYECTO
              </Typography>
            </Paper>
          )}
        </Stack>

        {/* 👥 DATOS CRUZADOS: INVERSOR Y PROYECTO */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          
          {/* BLOQUE INVERSOR */}
          <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 32, height: 32 }}>
                <Person fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={900}>PERFIL DEL INVERSOR</Typography>
            </Stack>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={800}>USERNAME</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AlternateEmail sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    @{inversion.inversor?.nombre_usuario || 'no_user'}
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={800}>TITULAR</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {userName || `${inversion.inversor?.nombre} ${inversion.inversor?.apellido}` || 'Sin Nombre'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={800}>CORREO ELECTRÓNICO</Typography>
                <Typography variant="body2" color="text.secondary">{userEmail || inversion.inversor?.email || 'S/D'}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* BLOQUE PROYECTO */}
          <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 32, height: 32 }}>
                <Business fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={900}>ACTIVO ASOCIADO</Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={800}>NOMBRE DEL PROYECTO</Typography>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {inversion.proyectoInvertido?.nombre_proyecto || projectName || 'Desconocido'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.disabled" fontWeight={800} display="block" mb={0.5}>ESPECIFICACIONES</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={inversion.proyectoInvertido?.tipo_inversion?.toUpperCase() || 'DIRECTA'} 
                    size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }}
                  />
                  <Chip 
                    label={inversion.proyectoInvertido?.estado_proyecto?.toUpperCase() || 'ESPERA'} 
                    size="small" color="default" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }}
                  />
                </Stack>
              </Box>
              
              <Button
                variant="contained" fullWidth size="small" startIcon={<OpenIcon />}
                onClick={() => {
                   onClose();
                   navigate(`/admin/proyectos?highlight=${inversion.id_proyecto}`);
                }}
                sx={{ borderRadius: 2, mt: 1, fontWeight: 800, textTransform: 'none', py: 1 }}
              >
                Gestionar Proyecto
              </Button>
            </Stack>
          </Paper>
        </Stack>

        {/* 🕒 SECCIÓN: TRAZABILIDAD Y AUDITORÍA */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={900} color="text.secondary">CRONOLOGÍA TRANSACCIONAL</Typography>
          </Stack>

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={4} 
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.5 }} />}
          >
            <Box>
              <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ReceiptLong sx={{ fontSize: 12 }} /> REGISTRO INICIAL
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatDate(inversion.fecha_inversion || (inversion as any).createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UpdateIcon sx={{ fontSize: 12 }} /> ÚLTIMA ACTUALIZACIÓN
              </Typography>
              <Typography variant="body2" fontWeight={700}>
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