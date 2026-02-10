import {
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as CancelledIcon,
  List as ListIcon
} from '@mui/icons-material';
import {
  Alert, Box, Chip, Paper, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Typography, alpha, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import SuscripcionService from '../../../../../core/api/services/suscripcion.service';
import type { SuscripcionCanceladaDto, SuscripcionDto } from '../../../../../core/types/dto/suscripcion.dto';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';

interface ProyectoSuscripcionesProps {
  proyectoId: number;
}

type SubscriptionItem = SuscripcionDto | SuscripcionCanceladaDto;
type ViewType = 'all' | 'active' | 'cancelled';

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatCurrency = (amount: string | number) => {
  return `$${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};

const isCancelled = (item: SubscriptionItem): item is SuscripcionCanceladaDto => {
  return 'fecha_cancelacion' in item;
};

const ProyectoSuscripciones: React.FC<ProyectoSuscripcionesProps> = ({ proyectoId }) => {
  const theme = useTheme();
  const [view, setView] = useState<ViewType>('all');

  // --- QUERIES ---
  const { data: allSuscripciones = [], isLoading: loadingAll, error: errorAll } = useQuery({
    queryKey: ['suscripciones', 'all', proyectoId],
    queryFn: async () => (await SuscripcionService.getAllByProyectoId(proyectoId)).data,
  });

  const { data: cancelledSuscripciones = [], isLoading: loadingCancelled, error: errorCancelled } = useQuery({
    queryKey: ['suscripciones', 'cancelled', proyectoId],
    queryFn: async () => (await SuscripcionService.getCanceladasByProyectoId(proyectoId)).data,
  });

  const isLoading = loadingAll || loadingCancelled;
  const error = errorAll || errorCancelled;

  // --- LÓGICA DE FILTRADO ---
  const dataToShow = useMemo(() => {
    const active = allSuscripciones.filter((s: SuscripcionDto) => s.activo);
    if (view === 'active') return active;
    if (view === 'cancelled') return cancelledSuscripciones;
    return [...allSuscripciones, ...cancelledSuscripciones];
  }, [view, allSuscripciones, cancelledSuscripciones]);

  const headerSx = {
    color: 'text.secondary',
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    bgcolor: alpha(theme.palette.background.paper, 0.8),
    zIndex: 2
  };

  return (
    <Box>
      <Stack spacing={3} mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Auditoría de Suscripciones</Typography>
          <Typography variant="caption" color="text.secondary">Historial financiero y estado de adhesiones</Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 0.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', width: 'fit-content' }}>
          <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ minHeight: 40, '& .MuiTabs-indicator': { display: 'none' } }}>
            <Tab icon={<ListIcon fontSize="small" />} iconPosition="start" label="Todas" value="all" sx={{ minHeight: 40, borderRadius: 1.5 }} />
            <Tab icon={<ActiveIcon fontSize="small" />} iconPosition="start" label="Activas" value="active" sx={{ minHeight: 40, borderRadius: 1.5 }} />
            <Tab icon={<CancelledIcon fontSize="small" />} iconPosition="start" label="Canceladas" value="cancelled" sx={{ minHeight: 40, borderRadius: 1.5 }} />
          </Tabs>
        </Paper>
      </Stack>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        {dataToShow.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>No hay registros para mostrar.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 440 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerSx}>Ref</TableCell>
                  <TableCell sx={headerSx}>Usuario</TableCell>
                  <TableCell sx={headerSx}>{view === 'cancelled' ? 'Cancelación' : 'Inicio'}</TableCell>
                  <TableCell sx={headerSx} align="right">{view === 'cancelled' ? 'Pagados' : 'Deuda'}</TableCell>
                  <TableCell sx={headerSx} align="right">{view === 'cancelled' ? 'Total' : 'Saldo'}</TableCell>
                  <TableCell sx={headerSx} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataToShow.map((item) => {
                  const isCancel = isCancelled(item);
                  return (
                    <TableRow key={`${isCancel ? 'c' : 'a'}-${item.id}`} hover>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        #{isCancel ? (item.id_suscripcion_original || item.id) : item.id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : `ID: ${item.id_usuario}`}
                        </Typography>
                        {item.usuario?.email && <Typography variant="caption" color="text.secondary">{item.usuario.email}</Typography>}
                      </TableCell>
                      <TableCell>
                        {/* ✅ CORRECCIÓN: Usamos fecha_creacion de BaseDTO en lugar de createdAt */}
                        {formatDate(isCancel ? item.fecha_cancelacion : item.fecha_creacion)}
                      </TableCell>
                      <TableCell align="right">
                        {isCancel ? item.meses_pagados : item.meses_a_pagar}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: isCancel ? 'text.primary' : 'success.main' }}>
                        {formatCurrency(isCancel ? item.monto_pagado_total : item.saldo_a_favor)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isCancel ? 'Cancelada' : item.activo ? 'Activa' : 'Inactiva'}
                          size="small"
                          color={isCancel ? 'error' : item.activo ? 'success' : 'default'}
                          variant={isCancel ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 700, borderRadius: 1 }}
                        />
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