import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Chip, Divider, Box, Alert, Stack, Avatar 
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
import type { TransaccionDto } from '../../../../types/dto/transaccion.dto';

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
  if (!transaccion) return null;

  const isPendingOrFailed = ['pendiente', 'fallido'].includes(transaccion.estado_transaccion);

  // ⚡ ALIAS CORRECTO: Usamos proyectoTransaccion porque así viene de tu backend
  const proyectoData = transaccion.proyectoTransaccion;
  
  // Datos del Usuario formateados
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
      case 'expirado':
        return 'error';
      case 'reembolsado':
      case 'revertido': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Transacción #{transaccion.id}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
             <Typography variant="caption" color="text.secondary">
               Ref. Pasarela: 
             </Typography>
             <Chip 
               // Intentamos leer del objeto anidado primero
               label={transaccion.pagoPasarela?.id_transaccion_pasarela || transaccion.id_pago_pasarela || 'N/A'} 
               size="small" 
               variant="outlined" 
               sx={{ height: 20, fontSize: '0.7rem' }}
             />
          </Stack>
        </Box>
        <Chip 
          label={transaccion.estado_transaccion.toUpperCase().replace(/_/g, ' ')} 
          color={getStatusColor(transaccion.estado_transaccion) as any} 
          variant="filled"
          sx={{ fontWeight: 'bold' }}
        />
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        
        {/* SECCIÓN DE ERROR (Solo si existe) */}
        {transaccion.error_detalle && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">Detalle del Error:</Typography>
            {transaccion.error_detalle}
          </Alert>
        )}

        {/* LAYOUT PRINCIPAL FLEXBOX */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          
          {/* COLUMNA IZQUIERDA: DATOS FINANCIEROS */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
              DATOS FINANCIEROS
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney color="action" sx={{ fontSize: 40 }} />
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {Number(transaccion.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #eee' }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Category fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">TIPO DE OPERACIÓN</Typography>
                </Box>
                <Typography variant="body1" fontWeight={600}>
                  {transaccion.tipo_transaccion === 'pago_suscripcion_inicial' ? 'Suscripción Inicial' : 
                   transaccion.tipo_transaccion === 'directo' ? 'Inversión Directa' : 
                   transaccion.tipo_transaccion === 'mensual' ? 'Cuota Mensual' :
                   transaccion.tipo_transaccion.toUpperCase()}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Event color="action" />
                <Typography variant="body2">
                  {transaccion.fecha_transaccion 
                    ? format(new Date(transaccion.fecha_transaccion), "dd 'de' MMMM, yyyy - HH:mm", { locale: es }) 
                    : 'Fecha no registrada'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* COLUMNA DERECHA: CONTEXTO */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
              USUARIO Y CONTEXTO
            </Typography>
            <Stack spacing={2}>
              
              {/* Tarjeta Usuario */}
              <Box display="flex" alignItems="center" gap={2} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                  {transaccion.usuario?.nombre?.[0] || <Person />}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">USUARIO</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                    {usuarioNombre}
                  </Typography>
                  {transaccion.usuario && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {transaccion.usuario.email}
                    </Typography>
                  )}
                  {transaccion.usuario?.dni && (
                    <Typography variant="caption" color="text.secondary">
                      DNI: {transaccion.usuario.dni}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Tarjeta Proyecto */}
              {transaccion.id_proyecto && (
                <Box display="flex" alignItems="center" gap={2} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.light', width: 48, height: 48 }}><Business /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">PROYECTO</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                      {proyectoData 
                        ? proyectoData.nombre_proyecto 
                        : `ID: ${transaccion.id_proyecto}`}
                    </Typography>
                    {proyectoData && (
                      <Chip 
                        label={proyectoData.estado_proyecto} 
                        size="small" 
                        color={proyectoData.estado_proyecto === 'Activo' ? 'success' : 'default'} 
                        sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Referencias Técnicas */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight="bold">
                  REFERENCIAS TÉCNICAS
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {transaccion.id_inversion && (
                    <Chip icon={<Description fontSize="small"/>} label={`Inversión #${transaccion.id_inversion}`} size="small" variant="outlined" />
                  )}
                  {transaccion.id_suscripcion && (
                    <Chip icon={<Description fontSize="small"/>} label={`Suscripción #${transaccion.id_suscripcion}`} size="small" variant="outlined" />
                  )}
                  {transaccion.id_pago_mensual && (
                    <Chip icon={<CreditCard fontSize="small"/>} label={`Pago Mensual #${transaccion.id_pago_mensual}`} size="small" variant="outlined" />
                  )}
                  {transaccion.id_puja && (
                    <Chip icon={<AttachMoney fontSize="small"/>} label={`Puja #${transaccion.id_puja}`} size="small" variant="outlined" />
                  )}
                </Stack>
              </Box>

            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ZONA DE ACCIÓN PARA ADMIN */}
        {isPendingOrFailed && (
          <Box sx={{ bgcolor: '#FFF3E0', p: 2, borderRadius: 2, border: '1px dashed #FF9800' }}>
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <Bolt color="warning" />
              <Typography variant="subtitle2" color="warning.main" fontWeight="bold">
                Zona de Administración
              </Typography>
            </Stack>
            <Typography variant="body2" paragraph color="text.secondary">
              Si el dinero ingresó a la cuenta bancaria pero el webhook falló, puedes forzar la confirmación manual aquí. 
            </Typography>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={() => onForceConfirm(transaccion.id)}
              disabled={isConfirming}
              fullWidth
            >
              {isConfirming ? 'Procesando...' : 'Forzar Confirmación Manual'}
            </Button>
          </Box>
        )}

      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalDetalleTransaccion;