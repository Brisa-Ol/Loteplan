import React, { useState } from 'react';
import {
  Box, Paper, Typography, Stack, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, alpha, useTheme, Divider
} from '@mui/material';
import {
  List as ListIcon,
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as CancelledIcon,
  AttachMoney as MoneyIcon,
  Event as DateIcon,
  Person as PersonIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import type { SuscripcionCanceladaDto, SuscripcionDto } from '../../../../types/dto/suscripcion.dto';
import SuscripcionService from '../../../../Services/suscripcion.service';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';

interface ProyectoSuscripcionesProps {
  proyectoId: number;
}

type SubscriptionItem = SuscripcionDto | SuscripcionCanceladaDto;
type ViewType = 'all' | 'active' | 'cancelled';

// ✅ Helpers
const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatCurrency = (amount: string | number) => {
  return `$${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};

const ProyectoSuscripciones: React.FC<ProyectoSuscripcionesProps> = ({ proyectoId }) => {
  const theme = useTheme();
  const [view, setView] = useState<ViewType>('all');

  // ========================================================================
  // 🔍 QUERIES
  // ========================================================================

  const { data: allSuscripciones = [], isLoading: loadingAll, error: errorAll } = useQuery({
    queryKey: ['suscripciones', 'all', proyectoId],
    queryFn: async () => (await SuscripcionService.getAllByProyectoId(proyectoId)).data,
    enabled: view === 'all',
  });

  const { data: activeSuscripciones = [], isLoading: loadingActive, error: errorActive } = useQuery({
    queryKey: ['suscripciones', 'active', proyectoId],
    queryFn: async () => (await SuscripcionService.getActiveByProyectoId(proyectoId)).data,
    enabled: view === 'active',
  });

  const { data: cancelledSuscripciones = [], isLoading: loadingCancelled, error: errorCancelled } = useQuery({
    queryKey: ['suscripciones', 'cancelled', proyectoId],
    queryFn: async () => (await SuscripcionService.getCanceladasByProyectoId(proyectoId)).data,
    enabled: view === 'cancelled',
  });

  const isLoading = loadingAll || loadingActive || loadingCancelled;
  const error = errorAll || errorActive || errorCancelled;

  // Datos a mostrar
  const dataToShow: SubscriptionItem[] = 
    view === 'all' ? allSuscripciones :
    view === 'active' ? activeSuscripciones :
    cancelledSuscripciones;

  // Type Guard
  const isCancelled = (item: SubscriptionItem): item is SuscripcionCanceladaDto => {
    return (item as SuscripcionCanceladaDto).fecha_cancelacion !== undefined;
  };

  // Estilos de Cabecera de Tabla (Theme Global)
  const headerSx = {
    color: 'text.secondary',
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: alpha(theme.palette.background.paper, 0.4)
  };

  return (
    <Box>
      {/* Header y Filtros Estilizados */}
      <Stack spacing={3} mb={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Auditoría de Suscripciones
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Historial financiero y estado de adhesiones del proyecto
            </Typography>
          </Box>
        </Stack>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 0.5, 
            borderRadius: 2, 
            border: '1px solid', 
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            width: 'fit-content'
          }}
        >
          <Tabs 
            value={view} 
            onChange={(_, v) => setView(v)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{
               minHeight: 40,
               '& .MuiTab-root': {
                 minHeight: 40,
                 borderRadius: 1.5,
                 textTransform: 'none',
                 fontWeight: 600,
                 px: 2,
                 mr: 1,
                 '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                 '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
               },
               '& .MuiTabs-indicator': { display: 'none' } // Estilo tipo "Pill" sin linea abajo
            }}
          >
            <Tab icon={<ListIcon fontSize="small" />} iconPosition="start" label="Todas" value="all" />
            <Tab icon={<ActiveIcon fontSize="small" />} iconPosition="start" label="Activas" value="active" sx={{ color: 'success.main', '&.Mui-selected': { color: 'success.dark', bgcolor: alpha(theme.palette.success.main, 0.1) } }} />
            <Tab icon={<CancelledIcon fontSize="small" />} iconPosition="start" label="Canceladas" value="cancelled" sx={{ color: 'error.main', '&.Mui-selected': { color: 'error.dark', bgcolor: alpha(theme.palette.error.main, 0.1) } }} />
          </Tabs>
        </Paper>
      </Stack>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        {dataToShow.length === 0 ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            No hay suscripciones registradas en la categoría seleccionada.
          </Alert>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerSx}>ID Ref</TableCell>
                  <TableCell sx={headerSx}><Stack direction="row" gap={0.5} alignItems="center"><PersonIcon fontSize="inherit"/> Usuario</Stack></TableCell>
                  <TableCell sx={headerSx}><Stack direction="row" gap={0.5} alignItems="center"><DateIcon fontSize="inherit"/> {view === 'cancelled' ? 'Cancelación' : 'Inicio'}</Stack></TableCell>
                  <TableCell sx={headerSx} align="right">
                    {view === 'cancelled' ? 'Meses Pagados' : 'Meses Deuda'}
                  </TableCell>
                  <TableCell sx={headerSx} align="right">
                    <Stack direction="row" gap={0.5} alignItems="center" justifyContent="flex-end"><MoneyIcon fontSize="inherit"/> {view === 'cancelled' ? 'Total Abonado' : 'Saldo a Favor'}</Stack>
                  </TableCell>
                  <TableCell sx={headerSx} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataToShow.map((item) => {
                  const isCancelada = isCancelled(item);
                  
                  return (
                    <TableRow 
                      key={`${isCancelada ? 'c' : 'a'}-${item.id}`} 
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      {/* ID */}
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                        #{isCancelada ? ((item as any).id_suscripcion_original || item.id) : item.id}
                      </TableCell> 
                      
                      {/* Usuario */}
                      <TableCell sx={{ fontWeight: 600 }}>
                        ID: {item.id_usuario}
                      </TableCell>
                      
                      {/* Fecha */}
                      <TableCell>
                        {formatDate(isCancelada ? item.fecha_cancelacion : item.createdAt)}
                      </TableCell>
                      
                      {/* Métricas Numéricas */}
                      <TableCell align="right">
                        {isCancelada ? item.meses_pagados : item.meses_a_pagar}
                      </TableCell>
                      
                      <TableCell align="right" sx={{ fontWeight: 600, color: isCancelada ? 'text.primary' : 'success.main' }}>
                        {formatCurrency(isCancelada ? item.monto_pagado_total : item.saldo_a_favor)}
                      </TableCell>
                      
                      {/* Estado Chip */}
                      <TableCell align="center">
                        {isCancelada ? (
                           <Chip 
                             label="Cancelada" 
                             size="small" 
                             icon={<HistoryIcon fontSize="small" />}
                             sx={{ 
                               bgcolor: alpha(theme.palette.error.main, 0.1), 
                               color: 'error.main',
                               fontWeight: 700,
                               border: '1px solid',
                               borderColor: alpha(theme.palette.error.main, 0.2)
                             }} 
                           />
                        ) : (
                           <Chip 
                             label={item.activo ? 'Activa' : 'Inactiva'} 
                             size="small" 
                             icon={item.activo ? <ActiveIcon fontSize="small" /> : undefined}
                             sx={{ 
                               bgcolor: item.activo ? alpha(theme.palette.success.main, 0.1) : theme.palette.action.hover,
                               color: item.activo ? 'success.main' : 'text.secondary',
                               fontWeight: 700,
                               border: '1px solid',
                               borderColor: item.activo ? alpha(theme.palette.success.main, 0.2) : theme.palette.divider
                             }} 
                           />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </QueryHandler>
    </Box>
  );
};

export default ProyectoSuscripciones;