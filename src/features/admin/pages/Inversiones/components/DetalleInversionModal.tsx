// src/pages/Admin/Inversiones/components/DetalleInversionModal.tsx

import React from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, Button, useTheme, alpha
} from '@mui/material';
import { 
  Person,
  Business,
  ReceiptLong,
  CalendarToday,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
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

  // Determinar color según estado para el header y componentes
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' => {
    switch (status) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'fallido': return 'error';
      case 'reembolsado': return 'info';
      default: return 'primary';
    }
  };

  const statusColor = getStatusColor(inversion.estado);
  const themeColorMain = theme.palette[statusColor].main;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Inversión #${inversion.id}`}
      subtitle="Detalle completo de la transacción"
      icon={<ReceiptLong />}
      headerColor={statusColor}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip 
          label={inversion.estado.toUpperCase()} 
          color={statusColor} 
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>
        
        {/* SECCIÓN 1: MONTOS */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, borderRadius: 2, 
            border: '1px solid', 
            borderColor: alpha(themeColorMain, 0.3),
            bgcolor: alpha(themeColorMain, 0.04) 
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
              MONTO TOTAL INVERTIDO
            </Typography>
            <Typography variant="h3" fontWeight={800} color={`${statusColor}.main`} sx={{ my: 0.5 }}>
              ${Number(inversion.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Paper>

        {/* COLUMNAS: USUARIO Y PROYECTO */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          
          {/* INVERSOR */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>INVERSOR</Typography>
            </Stack>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Nombre Completo</Typography>
                <Typography variant="body1" fontWeight={600}>{userName || 'No disponible'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                <Typography variant="body2" fontWeight={500}>{userEmail || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">ID Usuario</Typography>
                <Typography variant="body2" color="text.secondary">#{inversion.id_usuario}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* PROYECTO */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Business color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PROYECTO DESTINO</Typography>
            </Stack>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Nombre del Proyecto</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {inversion.proyecto?.nombre_proyecto || projectName || 'No disponible'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">ID Proyecto</Typography>
                <Typography variant="body2" color="text.secondary">#{inversion.id_proyecto}</Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<OpenIcon />}
                onClick={() => navigate(`/admin/proyectos`)}
                sx={{ borderRadius: 2, mt: 1, fontWeight: 700 }}
              >
                Ver Proyecto
              </Button>
            </Stack>
          </Paper>
        </Stack>

        {/* SECCIÓN 4: FECHAS */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <CalendarToday color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={800}>CRONOLOGÍA</Typography>
          </Stack>
          
          <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="caption" color="text.secondary">Fecha Inversión</Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(inversion.fecha_inversion || inversion.createdAt || '').toLocaleDateString('es-AR')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Última Act.</Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(inversion.updatedAt || '').toLocaleDateString('es-AR')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

      </Stack>
    </BaseModal>
  );
};

export default DetalleInversionModal;