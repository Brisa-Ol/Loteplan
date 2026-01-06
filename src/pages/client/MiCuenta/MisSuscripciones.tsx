// src/pages/User/Suscripciones/MisSuscripciones.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Button, Stack, Chip,
  Tabs, Tab, Card, Avatar, Divider, 
  useTheme, alpha, Paper, Tooltip, IconButton
} from '@mui/material';
import { 
  Cancel as CancelIcon, Visibility as VisibilityIcon,
  Token as TokenIcon, EventRepeat as MesesIcon,
  History as HistoryIcon, MonetizationOn, CheckCircle,
  EventBusy, PlayCircleFilled, Business
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../services/suscripcion.service';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';
import type { ApiError } from '../../../services/httpService';

// --- COMPONENTES Y HOOKS ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useSnackbar } from '../../../hooks/useSnackbar';
import GlobalSnackbar from '../../../components/common/GlobalSnackbarProps/GlobalSnackbarProps';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // Hooks
  const confirmDialog = useConfirmDialog<SuscripcionDto>();
  const { snackbar, showSuccess, showError, handleClose: closeSnackbar } = useSnackbar();

  // Estados
  const [tabValue, setTabValue] = useState(0); 
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['misSuscripcionesFull'],
    queryFn: async () => {
      const [resActivas, resCanceladas] = await Promise.all([
        SuscripcionService.getMisSuscripciones(),
        SuscripcionService.getMisCanceladas()
      ]);
      return {
        activas: resActivas.data,
        canceladas: resCanceladas.data
      };
    }
  });

  const suscripciones = data?.activas || [];
  const canceladas = data?.canceladas || [];

  // Mutaciones
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelar(id),
    onSuccess: (_, variables) => { 
      queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
      confirmDialog.close(); 
      
      setHighlightedId(variables);
      setTimeout(() => setHighlightedId(null), 2500);
      
      showSuccess('Suscripción cancelada correctamente.'); 
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      confirmDialog.close();
      if (apiError.status !== 403) {
          const mensaje = apiError.message || "Error al cancelar.";
          showError(mensaje); 
      }
    }
  });

  // Handlers
  const handleOpenCancelDialog = useCallback((suscripcion: SuscripcionDto) => {
    confirmDialog.confirm('cancel_subscription', suscripcion);
  }, [confirmDialog]);

  const handleConfirmCancel = () => {
    if (confirmDialog.data) cancelMutation.mutate(confirmDialog.data.id);
  };

  // Helpers
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  // Stats
  const stats = useMemo(() => ({
    activas: suscripciones.length,
    canceladas: canceladas.length,
    totalPagado: suscripciones.reduce((acc: number, s: SuscripcionDto) => acc + Number(s.monto_total_pagado || 0), 0)
  }), [suscripciones, canceladas]);

  // Columnas Activas
  const columnsActivas = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
    {
      id: 'proyecto', label: 'Proyecto', minWidth: 220,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <Business fontSize="small" />
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                    {row.proyectoAsociado?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    ID: {row.id}
                </Typography>
            </Box>
        </Stack>
      )
    },
    {
      id: 'tokens', label: 'Tokens', minWidth: 120,
      render: (row) => (
        <Chip 
            icon={<TokenIcon sx={{ fontSize: '14px !important' }} />} 
            label={`${row.tokens_disponibles ?? 0} Tokens`} 
            size="small" variant="outlined" 
            sx={{ borderColor: theme.palette.info.main, color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.05), fontWeight: 600 }} 
        />
      )
    },
    {
      id: 'progreso', label: 'Progreso', minWidth: 150,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <MesesIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.primary">{row.meses_a_pagar} pendientes</Typography>
        </Stack>
      )
    },
    {
      id: 'total_pagado', label: 'Total Pagado', minWidth: 150,
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={700} color="primary.main">
                {formatCurrency(Number(row.monto_total_pagado))}
            </Typography>
            {Number(row.saldo_a_favor) > 0 && (
                <Typography variant="caption" display="block" color="success.main" fontWeight={600}>
                    +{formatCurrency(Number(row.saldo_a_favor))} favor
                </Typography>
            )}
        </Box>
      )
    },
    {
        id: 'estado', label: 'Estado', minWidth: 100,
        render: () => (
            <Chip label="Activa" color="success" size="small" variant="filled" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} sx={{ fontWeight: 600 }} />
        )
    },
    {
        id: 'acciones', label: 'Acciones', align: 'right', minWidth: 180,
        render: (row) => (
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Ver detalle del proyecto">
                    <IconButton size="small" onClick={() => navigate(`/proyectos/${row.id_proyecto}`)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Cancelar suscripción">
                    <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon fontSize="small" />} onClick={() => handleOpenCancelDialog(row)} sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}>
                        Cancelar
                    </Button>
                </Tooltip>
            </Stack>
        )
    }
  ], [theme, navigate, handleOpenCancelDialog]);

  // Columnas Canceladas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnsCanceladas = useMemo<DataTableColumn<any>[]>(() => [
    {
        id: 'proyecto', label: 'Proyecto', minWidth: 200,
        render: (row) => (
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.text.disabled, 0.1), color: 'text.disabled' }}><Business fontSize="small" /></Avatar>
                <Typography variant="body2" fontWeight={600} color="text.secondary">{row.proyecto?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}</Typography>
            </Stack>
        )
    },
    {
        id: 'fecha_cancelacion', label: 'Fecha Baja', minWidth: 120,
        render: (row) => <Typography variant="body2" color="text.secondary">{formatDate(row.fecha_cancelacion)}</Typography>
    },
    {
        id: 'meses_pagados', label: 'Meses Pagados', minWidth: 120,
        render: (row) => <Typography variant="body2" color="text.secondary">{row.meses_pagados} meses</Typography>
    },
    {
        id: 'total_liquidado', label: 'Liquidado Total', minWidth: 150,
        render: (row) => <Typography variant="body2" fontWeight={600} color="text.primary">{formatCurrency(Number(row.monto_pagado_total))}</Typography>
    },
    {
        id: 'estado', label: 'Estado', minWidth: 100,
        render: () => <Chip label="Cancelada" size="small" variant="outlined" icon={<EventBusy sx={{ fontSize: '14px !important' }} />} sx={{ borderColor: theme.palette.text.disabled, color: theme.palette.text.disabled, fontWeight: 500 }} />
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Suscripciones" subtitle='Gestiona tus pagos recurrentes y visualiza tu historial.' />

      {/* KPI SUMMARY */}
      <Box mb={4} display="flex" justifyContent="center">
        <Card elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: 'background.paper', minWidth: { xs: '100%', md: '80%' } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 2 }} />} spacing={{ xs: 4, sm: 4 }} justifyContent="center" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 56, height: 56 }}><PlayCircleFilled fontSize="large" /></Avatar>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>ACTIVAS</Typography>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{stats.activas}</Typography>
                </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}><MonetizationOn fontSize="large" /></Avatar>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL PAGADO</Typography>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{formatCurrency(stats.totalPagado)}</Typography>
                </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 56, height: 56 }}><EventBusy fontSize="large" /></Avatar>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>BAJAS</Typography>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{stats.canceladas}</Typography>
                </Box>
            </Stack>
          </Stack>
        </Card>
      </Box>

      {/* PESTAÑAS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Suscripciones Activas" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Historial de Bajas" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
            {tabValue === 0 && (
                <DataTable
                    columns={columnsActivas}
                    data={suscripciones}
                    getRowKey={(row) => row.id}
                    pagination
                    defaultRowsPerPage={5}
                    emptyMessage="No tienes suscripciones activas."
                    highlightedRowId={highlightedId}
                />
            )}
            {tabValue === 1 && (
                <DataTable
                    columns={columnsCanceladas}
                    data={canceladas}
                    getRowKey={(row) => row.id}
                    pagination
                    defaultRowsPerPage={5}
                    emptyMessage="No tienes historial de cancelaciones."
                    isRowActive={() => false}
                />
            )}
        </Paper>
      </QueryHandler>

      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
        title="¿Cancelar suscripción?"
        description="Esta acción detendrá los pagos automáticos. Podrás reactivarla o invertir manualmente en el futuro si hay cupo."
      />

      <GlobalSnackbar {...snackbar} onClose={closeSnackbar} />
    </PageContainer>
  );
};

export default MisSuscripciones;