import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box
} from '@mui/material';
import { 
  Close as CloseIcon,
  Person,
  Business,
  ReceiptLong,
  CalendarToday
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { InversionDto } from '../../../../types/dto/inversion.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  inversion: InversionDto | null;
  // Datos auxiliares calculados en el componente padre
  userName?: string; 
  userEmail?: string;
  projectName?: string;
}

const DetalleInversionModal: React.FC<Props> = ({ 
  open, onClose, inversion, userName, userEmail, projectName 
}) => {
  const navigate = useNavigate();

  if (!inversion) return null;

  // Determinar color según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'fallido': return 'error';
      case 'reembolsado': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptLong color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Inversión #{inversion.id}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* USAMOS STACK EN LUGAR DE GRID CONTAINER */}
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          {/* SECCIÓN 1: ESTADO Y MONTOS (Tarjeta Ancha) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Monto de Inversión</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  ${Number(inversion.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Chip 
                label={inversion.estado.toUpperCase()} 
                color={getStatusColor(inversion.estado)} 
                sx={{ fontWeight: 'bold', px: 2 }}
              />
            </Stack>
          </Paper>

          {/* CONTENEDOR FLEX PARA LAS DOS COLUMNAS (Usuario y Proyecto) */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, // Columna en móvil, fila en escritorio
            gap: 2 // Espacio entre las cajas
          }}>
            
            {/* SECCIÓN 2: DATOS DEL USUARIO (Izquierda) */}
            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Person color="action" />
                <Typography variant="subtitle2" fontWeight="bold">Inversor</Typography>
              </Stack>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Nombre</Typography>
                  <Typography variant="body1" fontWeight={500}>{userName || 'Cargando...'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{userEmail || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ID Usuario</Typography>
                  <Typography variant="body2" color="text.secondary">#{inversion.id_usuario}</Typography>
                </Box>
              </Stack>
            </Paper>

            {/* SECCIÓN 3: DATOS DEL PROYECTO (Derecha) */}
            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Business color="action" />
                <Typography variant="subtitle2" fontWeight="bold">Proyecto Destino</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                  <Typography variant="caption" color="text.secondary">Proyecto</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {inversion.proyecto?.nombre_proyecto || projectName || 'Cargando...'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ID Proyecto</Typography>
                  <Typography variant="body2" color="text.secondary">#{inversion.id_proyecto}</Typography>
                </Box>
                
                <Box pt={1}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    onClick={() => navigate(`/admin/proyectos/${inversion.id_proyecto}`)}
                  >
                    Ver Proyecto Completo
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* SECCIÓN 4: FECHAS (Tarjeta Ancha) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <CalendarToday color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">Cronología</Typography>
            </Stack>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Creación</Typography>
                <Typography variant="body2">
                  {new Date(inversion.fecha_inversion || inversion.createdAt || '').toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Última Actualización</Typography>
                <Typography variant="body2">
                  {new Date(inversion.updatedAt || '').toLocaleDateString('es-AR')}
                </Typography>
              </Box>
            </Stack>
          </Paper>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleInversionModal;