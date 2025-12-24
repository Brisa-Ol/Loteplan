// src/pages/Admin/Inversiones/components/DetalleInversionModal.tsx

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box, Divider,
  useTheme, alpha
} from '@mui/material';
import { 
  Close as CloseIcon,
  Person,
  Business,
  ReceiptLong,
  CalendarToday,
  OpenInNew as OpenIcon
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
  const theme = useTheme();

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

  const statusColor = getStatusColor(inversion.estado);
  const themeColor = (theme.palette as any)[statusColor !== 'default' ? statusColor : 'primary'];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: theme.shadows[10] }
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            p: 1, borderRadius: '50%', display: 'flex' 
          }}>
            <ReceiptLong color="primary" fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              Inversión #{inversion.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Detalle de la transacción
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), p: 4 }}>
        <Stack spacing={3}>
          
          {/* SECCIÓN 1: ESTADO Y MONTOS (Tarjeta Ancha) */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5, borderRadius: 2, 
              border: '1px solid', 
              borderColor: alpha(themeColor.main, 0.3),
              bgcolor: alpha(themeColor.main, 0.04) 
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  MONTO DE INVERSIÓN
                </Typography>
                <Typography variant="h4" fontWeight={800} color={themeColor.main} sx={{ my: 0.5 }}>
                  ${Number(inversion.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Chip 
                label={inversion.estado.toUpperCase()} 
                color={statusColor as any} 
                variant="filled"
                sx={{ fontWeight: 'bold', px: 2, height: 32 }}
              />
            </Stack>
          </Paper>

          {/* CONTENEDOR FLEX PARA LAS DOS COLUMNAS (Usuario y Proyecto) */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            
            {/* SECCIÓN 2: DATOS DEL USUARIO (Izquierda) */}
            <Paper 
              elevation={0}
              sx={{ 
                flex: 1, p: 2.5, borderRadius: 2, 
                border: '1px solid', borderColor: 'divider' 
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Person color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>INVERSOR</Typography>
              </Stack>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {userName || 'Cargando...'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {userEmail || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ID Usuario</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    #{inversion.id_usuario}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* SECCIÓN 3: DATOS DEL PROYECTO (Derecha) */}
            <Paper 
              elevation={0}
              sx={{ 
                flex: 1, p: 2.5, borderRadius: 2, 
                border: '1px solid', borderColor: 'divider' 
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Business color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>PROYECTO DESTINO</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nombre del Proyecto</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {inversion.proyecto?.nombre_proyecto || projectName || 'Cargando...'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ID Proyecto</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      #{inversion.id_proyecto}
                    </Typography>
                  </Box>
                  
                  <Box pt={1}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      fullWidth 
                      startIcon={<OpenIcon />}
                      onClick={() => navigate(`/admin/proyectos`)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Ir a Proyectos
                    </Button>
                  </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* SECCIÓN 4: FECHAS (Tarjeta Ancha) */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5, borderRadius: 2, 
              border: '1px solid', borderColor: 'divider' 
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <CalendarToday color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                CRONOLOGÍA
              </Typography>
            </Stack>
            
            <Stack 
              direction="row" 
              spacing={4} 
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Creación</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(inversion.fecha_inversion || inversion.createdAt || '').toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Última Actualización</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(inversion.updatedAt || '').toLocaleDateString('es-AR')}
                </Typography>
              </Box>
            </Stack>
          </Paper>

        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button 
            onClick={onClose} 
            variant="contained" 
            color="inherit" 
            sx={{ borderRadius: 2, px: 4, bgcolor: theme.palette.grey[800], color: 'white', '&:hover': { bgcolor: theme.palette.grey[900] } }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleInversionModal;