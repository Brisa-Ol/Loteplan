import React from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, useTheme, alpha, Button, Alert
} from '@mui/material';
import { 
  Gavel, Person, CalendarToday, Business as LoteIcon, Warning, Receipt, OpenInNew, EmojiEvents
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { PujaDto } from '../../../../../core/types/dto/puja.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onClose: () => void;
  puja: PujaDto | null;
  // Props adicionales para contexto
  loteName?: string;
  userName?: string;
  // ✅ CORRECCIÓN: Permitimos 'null' además de 'undefined' y 'boolean/number'
  isHighest?: boolean | null; 
  rankingPosition?: number | null; 
}

const DetallePujaModal: React.FC<Props> = ({ 
  open, onClose, puja, loteName, userName, isHighest, rankingPosition 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!puja) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ganadora_pagada': return 'success';
      case 'ganadora_pendiente': return 'warning';
      case 'activa': return 'info';
      case 'ganadora_incumplimiento': return 'error';
      default: return 'primary';
    }
  };

  const statusColor = getStatusColor(puja.estado_puja);
  // Aseguramos que el color exista en el tema, fallback a primary
  const themeColorMain = (theme.palette as any)[statusColor]?.main || theme.palette.primary.main;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Puja #${puja.id}`}
      subtitle="Detalle de la oferta realizada"
      icon={<Gavel />}
      headerColor={statusColor as any}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip 
          label={puja.estado_puja.toUpperCase().replace('_', ' ')} 
          color={statusColor as any} 
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>
        
        {/* SECCIÓN 0: CONTEXTO DE RANKING (Solo si está activa) */}
        {puja.estado_puja === 'activa' && rankingPosition && (
           <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderLeft: `4px solid ${theme.palette.info.main}` }}>
             <Stack direction="row" alignItems="center" justifyContent="space-between">
               <Box>
                 <Typography variant="subtitle2" fontWeight={700} color="info.main">POSICIÓN ACTUAL</Typography>
                 <Typography variant="body2">
                   Esta puja está en la posición <strong>#{rankingPosition}</strong> del ranking de este lote.
                 </Typography>
               </Box>
               {isHighest && (
                 <Chip label="LIDERANDO SUBASTA" color="success" size="small" icon={<EmojiEvents />} />
               )}
             </Stack>
           </Paper>
        )}

        {/* SECCIÓN 1: MONTO OFERTADO */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, borderRadius: 2, 
            border: '1px solid', 
            borderColor: alpha(themeColorMain, 0.3),
            bgcolor: alpha(themeColorMain, 0.04),
            textAlign: 'center'
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
            MONTO OFERTADO
          </Typography>
          <Typography variant="h3" fontWeight={800} color={themeColorMain}>
            ${Number(puja.monto_puja).toLocaleString('es-AR')}
          </Typography>
        </Paper>

        {/* SECCIÓN 1.5: TRANSACCIÓN VINCULADA */}
        {puja.id_transaccion && (
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Receipt color="action" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>TRANSACCIÓN VINCULADA</Typography>
                  <Typography variant="caption">ID Ref: #{puja.id_transaccion}</Typography>
                </Box>
              </Stack>
              <Button 
                size="small" 
                endIcon={<OpenInNew />} 
                onClick={() => navigate(`/admin/transacciones/${puja.id_transaccion}`)}
              >
                Ver Detalle
              </Button>
            </Stack>
          </Paper>
        )}

        {/* SECCIÓN 2: CONTEXTO (Usuario y Lote) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Postor */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} mb={2} alignItems="center">
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>POSTOR</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre / ID</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {userName || `Usuario ID: ${puja.id_usuario}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ID Sistema</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  #{puja.id_usuario}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Lote */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} mb={2} alignItems="center">
              <LoteIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>LOTE OBJETIVO</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre del Lote</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {loteName || puja.lote?.nombre_lote || `Lote ID: ${puja.id_lote}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ID Lote</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  #{puja.id_lote}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        {/* SECCIÓN 3: FECHAS */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} mb={2} alignItems="center">
            <CalendarToday color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">CRONOLOGÍA</Typography>
          </Stack>
          
          <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="caption" color="text.secondary">Fecha Realizada</Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(puja.fecha_puja).toLocaleDateString('es-AR')} {new Date(puja.fecha_puja).toLocaleTimeString('es-AR')}
              </Typography>
            </Box>
            
            {puja.estado_puja === 'ganadora_pendiente' && puja.fecha_vencimiento_pago && (
              <Box>
                <Typography variant="caption" color="text.secondary">Vencimiento de Pago</Typography>
                <Typography variant="body1" color="error.main" fontWeight={700}>
                  {new Date(puja.fecha_vencimiento_pago).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* ALERTA DE IMPAGO */}
        {puja.estado_puja === 'ganadora_incumplimiento' && (
          <Alert severity="error" variant="outlined" icon={<Warning fontSize="inherit" />}>
             <Typography variant="subtitle2" fontWeight={800}>
                IMPAGO REGISTRADO
             </Typography>
             Esta puja fue anulada por incumplimiento de pago. El token del usuario fue gestionado según políticas.
          </Alert>
        )}

      </Stack>
    </BaseModal>
  );
};

export default DetallePujaModal;