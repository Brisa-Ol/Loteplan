import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Stack, Chip,
  Tabs, Tab, Card, Avatar, Divider, 
  useTheme, alpha, Paper, Tooltip
} from '@mui/material';
import { 
  Cancel as CancelIcon, Visibility as VisibilityIcon,
  Token as TokenIcon, EventRepeat as MesesIcon,
  History as HistoryIcon, MonetizationOn, CheckCircle,
  EventBusy, PlayCircleFilled, Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES Y HOOKS ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const confirmDialog = useConfirmDialog();

  // --- ESTADOS ---
  const [tabValue, setTabValue] = useState(0); 

  // --- QUERIES ---
  const { data, isLoading, refetch, error } = useQuery({
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
    onSuccess: async () => {
      await refetch(); 
      confirmDialog.close(); 
    },
    onError: (err: any) => {
      const mensaje = err.response?.data?.message || "Error al cancelar.";
      alert(`❌ Error: ${mensaje}`);
    }
  });

  // Handlers
  const handleOpenCancelDialog = (suscripcion: SuscripcionDto) => {
    confirmDialog.confirm('cancel_subscription', suscripcion);
  };

  const handleConfirmCancel = () => {
    if (confirmDialog.data) cancelMutation.mutate(confirmDialog.data.id);
  };

  // Helpers
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
      minWidth: 200,
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">
                {row.proyectoAsociado?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                ID: {row.id}
            </Typography>
        </Box>
      )
    },
    {
      id: 'tokens',
      label: 'Tokens',
      minWidth: 120,
      render: (row) => (
        <Chip 
            icon={<TokenIcon sx={{ fontSize: '14px !important' }} />} 
            label={row.tokens_disponibles ?? 0} 
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
            <Typography variant="body2" color="text.secondary">
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
            <Chip label="Activa" color="success" size="small" variant="filled" sx={{ fontWeight: 600 }} />
        )
    },
    {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        minWidth: 180,
        render: (row) => (
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Ver detalle">
                    <Button
                        variant="outlined"
                        color="inherit" // Neutro para "Ver"
                        size="small"
                        onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}
                        sx={{ minWidth: 40, p: 1, borderColor: theme.palette.divider, color: 'text.secondary' }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </Button>
                </Tooltip>
                
                <Tooltip title="Cancelar suscripción">
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon fontSize="small" />}
                        onClick={() => handleOpenCancelDialog(row)}
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    >
                        Cancelar
                    </Button>
                </Tooltip>
            </Stack>
        )
    }
  ], [theme, navigate]);

  // --- DEFINICIÓN DE COLUMNAS (Canceladas) ---
  // Nota: Usamos any o un tipo específico para canceladas si difiere mucho de SuscripcionDto
  const columnsCanceladas = useMemo<DataTableColumn<any>[]>(() => [
    {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 200,
        render: (row) => (
            <Typography variant="body2" fontWeight={600} color="text.secondary">
                {row.proyecto?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
            </Typography>
        )
    },
    {
        id: 'fecha_cancelacion',
        label: 'Fecha Baja',
        minWidth: 120,
        render: (row) => (
            <Typography variant="body2">{formatDate(row.fecha_cancelacion)}</Typography>
        )
    },
    {
        id: 'meses_pagados',
        label: 'Meses Pagados',
        minWidth: 120,
        render: (row) => (
            <Typography variant="body2">{row.meses_pagados} meses</Typography>
        )
    },
    {
        id: 'total_liquidado',
        label: 'Liquidado Total',
        minWidth: 150,
        render: (row) => (
            <Typography variant="body2" fontWeight={600}>
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

      {/* --- KPI SECTION --- */}
      <Box mb={4} display="flex" justifyContent="center">
        <Card 
          elevation={0}
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center', 
            p: 2,
            width: 'fit-content',
            bgcolor: 'background.paper', 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3
          }}
        >
          {/* Activas */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
              <PlayCircleFilled />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ACTIVAS</Typography>
              <Typography variant="h5" fontWeight={800} color="text.primary">{stats.activas}</Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />
          <Divider flexItem sx={{ display: { xs: 'block', md: 'none' }, width: '100%', my: 1 }} />

          {/* Pagado */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
              <MonetizationOn />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL PAGADO</Typography>
              <Typography variant="h5" fontWeight={800} color="text.primary">{formatCurrency(stats.totalPagado)}</Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />
          <Divider flexItem sx={{ display: { xs: 'block', md: 'none' }, width: '100%', my: 1 }} />

          {/* Canceladas */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
              <EventBusy />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>BAJAS</Typography>
              <Typography variant="h5" fontWeight={800} color="text.primary">{stats.canceladas}</Typography>
            </Box>
          </Stack>
        </Card>
      </Box>

      {/* --- PESTAÑAS --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
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
                    emptyMessage="No tienes suscripciones activas."
                />
            )}

            {tabValue === 1 && (
                <DataTable
                    columns={columnsCanceladas}
                    data={canceladas}
                    getRowKey={(row) => row.id}
                    pagination
                    emptyMessage="No tienes historial de cancelaciones."
                    getRowSx={() => ({ opacity: 0.8 })}
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