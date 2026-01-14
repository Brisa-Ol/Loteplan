// src/pages/User/Suscripciones/MisSuscripciones.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Button, Stack, Chip,
  Tabs, Tab, Avatar, alpha, Paper, Tooltip, IconButton, useTheme
} from '@mui/material';
import { 
  Cancel as CancelIcon, Visibility as VisibilityIcon,
  Token as TokenIcon, EventRepeat as MesesIcon,
  History as HistoryIcon, MonetizationOn, CheckCircle,
  EventBusy, Business, PlayCircleFilled
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../services/suscripcion.service';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES Y HOOKS ---
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../shared/components/ui/cards/ConfirmDialog/ConfirmDialog';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';

// ✅ Hook Global y Configuración Centralizada
import { useSnackbar } from '../../../context/SnackbarContext';
import { env } from '../../../config/env'; // 👈 IMPORTANTE

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const { showSuccess } = useSnackbar();

  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0); 
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  
  // --- QUERIES ---
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

  // --- MUTACIÓN CANCELAR ---
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelar(id),
    onSuccess: (_, variables) => { 
      queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
      confirmDialog.close(); 
      setHighlightedId(variables);
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess('Suscripción cancelada correctamente.');
    },
    onError: () => confirmDialog.close()
  });

  // Handlers
  const handleOpenCancelDialog = useCallback((suscripcion: SuscripcionDto) => {
    confirmDialog.confirm('cancel_subscription', suscripcion);
  }, [confirmDialog]);

  const handleConfirmCancel = () => {
    if (confirmDialog.data) cancelMutation.mutate(confirmDialog.data.id);
  };

  // ✅ HELPERS REFACTORIZADOS CON ENV
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(env.defaultLocale, { // 👈 Usamos configuración
        style: 'currency', 
        currency: env.defaultCurrency,         // 👈 Usamos configuración
        maximumFractionDigits: 0 
    }).format(val);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString(env.defaultLocale, { // 👈 Usamos configuración
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });

  // Stats
  const stats = useMemo(() => ({
    activas: suscripciones.length,
    canceladas: canceladas.length,
    totalPagado: suscripciones.reduce((acc, s) => acc + Number(s.monto_total_pagado || 0), 0)
  }), [suscripciones, canceladas]);

  // --- DEFINICIÓN DE COLUMNAS (Activas) ---
  const columnsActivas = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 220,
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
      id: 'tokens',
      label: 'Tokens',
      minWidth: 120,
      render: (row) => (
        <Chip 
            icon={<TokenIcon sx={{ fontSize: '14px !important' }} />} 
            label={`${row.tokens_disponibles ?? 0} Tokens`} 
            size="small" 
            variant="outlined" 
            sx={{ 
                borderColor: theme.palette.info.main, 
                color: theme.palette.info.main,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                fontWeight: 600
            }} 
        />
      )
    },
    {
      id: 'progreso',
      label: 'Progreso',
      minWidth: 150,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <MesesIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.primary">
                {row.meses_a_pagar} pendientes
            </Typography>
        </Stack>
      )
    },
    {
      id: 'total_pagado',
      label: 'Total Pagado',
      minWidth: 150,
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
        id: 'estado',
        label: 'Estado',
        minWidth: 100,
        render: () => (
            <Chip 
                label="Activa" 
                color="success" 
                size="small" 
                variant="filled" 
                icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                sx={{ fontWeight: 600 }} 
            />
        )
    },
    {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        minWidth: 180,
        render: (row) => (
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Ver detalle del proyecto">
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}
                        sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Cancelar suscripción">
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon fontSize="small" />}
                        onClick={() => handleOpenCancelDialog(row)}
                        sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                    >
                        Cancelar
                    </Button>
                </Tooltip>
            </Stack>
        )
    }
  ], [theme, navigate, handleOpenCancelDialog]);

  // --- DEFINICIÓN DE COLUMNAS (Canceladas) ---
  const columnsCanceladas = useMemo<DataTableColumn<any>[]>(() => [
    {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 200,
        render: (row) => (
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.text.disabled, 0.1), color: 'text.disabled' }}>
                    <Business fontSize="small" />
                </Avatar>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {row.proyecto?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
                </Typography>
            </Stack>
        )
    },
    {
        id: 'fecha_cancelacion',
        label: 'Fecha Baja',
        minWidth: 120,
        render: (row) => (
            <Typography variant="body2" color="text.secondary">{formatDate(row.fecha_cancelacion)}</Typography>
        )
    },
    {
        id: 'meses_pagados',
        label: 'Meses Pagados',
        minWidth: 120,
        render: (row) => (
            <Typography variant="body2" color="text.secondary">{row.meses_pagados} meses</Typography>
        )
    },
    {
        id: 'total_liquidado',
        label: 'Liquidado Total',
        minWidth: 150,
        render: (row) => (
            <Typography variant="body2" fontWeight={600} color="text.primary">
                {formatCurrency(Number(row.monto_pagado_total))}
            </Typography>
        )
    },
    {
        id: 'estado',
        label: 'Estado',
        minWidth: 100,
        render: () => (
            <Chip 
                label="Cancelada" 
                size="small" 
                variant="outlined" 
                icon={<EventBusy sx={{ fontSize: '14px !important' }} />}
                sx={{ 
                    borderColor: theme.palette.text.disabled, 
                    color: theme.palette.text.disabled,
                    fontWeight: 500
                }} 
            />
        )
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Mis Suscripciones" 
        subtitle='Gestiona tus pagos recurrentes y visualiza tu historial.'
      />

      {/* --- KPI SUMMARY CON STATCARD --- */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, 
        gap: 2, 
        mb: 4 
      }}>
        <StatCard 
            title="Activas" 
            value={stats.activas.toString()} 
            icon={<PlayCircleFilled />} 
            color="success" 
            loading={isLoading}
            subtitle="Planes en curso"
        />
        <StatCard 
            title="Total Pagado" 
            value={formatCurrency(stats.totalPagado)} 
            icon={<MonetizationOn />} 
            color="primary" 
            loading={isLoading}
            subtitle="Capital invertido en cuotas"
        />
        <StatCard 
            title="Bajas Históricas" 
            value={stats.canceladas.toString()} 
            icon={<EventBusy />} 
            color="error" 
            loading={isLoading}
            subtitle="Suscripciones canceladas"
        />
      </Box>

      {/* --- PESTAÑAS --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)} 
            textColor="primary" 
            indicatorColor="primary"
        >
          <Tab label="Suscripciones Activas" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Historial de Bajas" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Paper 
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[1]
            }}
        >
            {tabValue === 0 && (
                <DataTable
                    columns={columnsActivas}
                    data={suscripciones}
                    getRowKey={(row) => row.id}
                    pagination
                    // ✅ Paginación: Mantenemos 5 para vista de usuario, pero es configurable
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

      {/* MODAL CONFIRMACIÓN */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
        title="¿Cancelar suscripción?"
        description="Esta acción detendrá los pagos automáticos. Podrás reactivarla o invertir manualmente en el futuro si hay cupo."
      />

    </PageContainer>
  );
};

export default MisSuscripciones;