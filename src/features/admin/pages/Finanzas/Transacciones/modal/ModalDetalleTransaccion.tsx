// src/pages/Admin/Transacciones/modal/ModalDetalleTransaccion.tsx

import React from 'react';
import { 
  Typography, Chip, Divider, Box, Alert, Stack, Avatar, 
  useTheme, alpha, Paper, Button
} from '@mui/material';
import { 
  AttachMoney, 
  Event, 
  Category, 
  Error as ErrorIcon,
  Bolt, 
  Person,
  Business,
  CreditCard,
  Description
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TransaccionDto } from '../../../../../../core/types/dto/transaccion.dto';
import BaseModal from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onClose: () => void;
  transaccion: TransaccionDto | null;
  onForceConfirm: (id: number) => void;
  isConfirming: boolean;
}

const ModalDetalleTransaccion: React.FC<Props> = ({ 
  open, onClose, transaccion, onForceConfirm, isConfirming 
}) => {
  const theme = useTheme();

  if (!transaccion) return null;

  const isPendingOrFailed = ['pendiente', 'fallido'].includes(transaccion.estado_transaccion);
  const proyectoData = transaccion.proyectoTransaccion;
  const usuarioNombre = transaccion.usuario 
    ? `${transaccion.usuario.nombre} ${transaccion.usuario.apellido}`
    : `Usuario ID: ${transaccion.id_usuario}`;

  const getStatusColor = (status: string) => {
    switch (status) {
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
  };

  const statusColor = getStatusColor(transaccion.estado_transaccion);

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
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      {/* SECCIÓN DE ERROR */}
      {transaccion.error_detalle && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">Detalle del Error:</Typography>
          {transaccion.error_detalle}
        </Alert>
      )}

      {/* LAYOUT PRINCIPAL */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA: FINANZAS */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Datos Financieros
          </Typography>
          
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <AttachMoney color="action" sx={{ fontSize: 40 }} />
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {Number(transaccion.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </Typography>
            </Box>
            
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.action.active, 0.04) 
              }}
            >
              <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                <Category fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" fontWeight="bold">TIPO DE OPERACIÓN</Typography>
              </Stack>
              <Typography variant="body1" fontWeight={600}>
                {transaccion.tipo_transaccion === 'pago_suscripcion_inicial' ? 'Suscripción Inicial' : 
                 transaccion.tipo_transaccion === 'directo' ? 'Inversión Directa' : 
                 transaccion.tipo_transaccion === 'mensual' ? 'Cuota Mensual' :
                 transaccion.tipo_transaccion.toUpperCase()}
              </Typography>
            </Paper>

            <Stack direction="row" alignItems="center" gap={1}>
              <Event color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {transaccion.fecha_transaccion 
                  ? format(new Date(transaccion.fecha_transaccion), "dd 'de' MMMM, yyyy - HH:mm", { locale: es }) 
                  : 'Fecha no registrada'}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

        {/* COLUMNA DERECHA: USUARIO Y CONTEXTO */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Usuario y Contexto
          </Typography>
          
          <Stack spacing={2}>
            <Paper 
              elevation={0}
              sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                {transaccion.usuario?.nombre?.[0] || <Person />}
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">USUARIO</Typography>
                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>{usuarioNombre}</Typography>
                {transaccion.usuario?.email && (
                  <Typography variant="caption" color="text.secondary" display="block">{transaccion.usuario.email}</Typography>
                )}
              </Box>
            </Paper>

            {transaccion.id_proyecto && (
              <Paper 
                elevation={0}
                sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 48, height: 48 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">PROYECTO</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                    {proyectoData ? proyectoData.nombre_proyecto : `ID: ${transaccion.id_proyecto}`}
                  </Typography>
                  {proyectoData && (
                    <Chip label={proyectoData.estado_proyecto} size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
                  )}
                </Box>
              </Paper>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight="bold">REFERENCIAS</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {transaccion.id_inversion && <Chip icon={<Description fontSize="small"/>} label={`Inv #${transaccion.id_inversion}`} size="small" variant="outlined" />}
                {transaccion.id_suscripcion && <Chip icon={<Description fontSize="small"/>} label={`Susc #${transaccion.id_suscripcion}`} size="small" variant="outlined" />}
                {transaccion.id_pago_mensual && <Chip icon={<CreditCard fontSize="small"/>} label={`Pago #${transaccion.id_pago_mensual}`} size="small" variant="outlined" />}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ZONA DE ADMINISTRACIÓN */}
      {isPendingOrFailed && (
        <>
          <Divider sx={{ my: 3 }} />
          <Paper 
            elevation={0}
            sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.05), p: 2, borderRadius: 2, 
              border: '1px dashed', borderColor: 'warning.main' 
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <Bolt color="warning" />
              <Typography variant="subtitle2" color="warning.main" fontWeight="bold">Zona de Administración</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Si el dinero ingresó a la cuenta bancaria pero el sistema no se actualizó, fuerza la confirmación aquí.
            </Typography>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={() => onForceConfirm(transaccion.id)}
              disabled={isConfirming}
              fullWidth
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {isConfirming ? 'Procesando...' : 'Confirmar Transacción Manualmente'}
            </Button>
          </Paper>
        </>
      )}
    </BaseModal>
  );
};

export default ModalDetalleTransaccion;