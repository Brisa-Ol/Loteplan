// src/pages/Admin/Suscripciones/AdminSuscripciones.tsx

import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, IconButton, Tooltip,
  Stack, TextField, MenuItem, InputAdornment, LinearProgress, Avatar, Divider, alpha, useTheme, Tabs, Tab
} from '@mui/material';
import {
  CheckCircle, Cancel, Search, Visibility,
  MonetizationOn, TrendingDown, Warning, Groups,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import DetalleSuscripcionModal from './components/DetalleSuscripcionModal';
import CancelacionesTab from './components/CancelacionesTab';



// Hooks
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// ✅ Hook Global
import { useSnackbar } from '../../../context/SnackbarContext';
import SuscripcionService from '../../../services/suscripcion.service';
import ProyectoService from '../../../services/proyecto.service';

// --- SUBCOMPONENTE: StatCard ---
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      display: 'flex', alignItems: 'center', gap: 2,
      border: '1px solid', borderColor: 'divider',
      flex: 1, minWidth: 0
    }}
  >
    <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
      {icon}
    </Box>
    <Box sx={{ width: '100%' }}>
      {loading ? (
        <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
      ) : (
        <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
      )}
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
    </Box>
  </Paper>
);

const AdminSuscripciones: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  // ✅ Usamos el contexto global para éxito
  const { showSuccess } = useSnackbar();

  // 1. Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activas' | 'inactivas'>('activas');

  // 2. Hooks de Modales y Dialogs
  const detailModal = useModal();
  const confirmDialog = useConfirmDialog();
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);

  // 3. Feedback Visual (Tabla)
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Estado para Tabs
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // 4. Queries
  const { data: suscripciones = [], isLoading: loadingSuscripciones, error } = useQuery({
    queryKey: ['adminSuscripciones', filterStatus],
    queryFn: async () => {
      if (filterStatus === 'activas') {
        const res = await SuscripcionService.findAllActivas();
        return res.data;
      }
      const res = await SuscripcionService.findAll();
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000,
  });

  const { data: morosidadStats, isLoading: loadMorosidad } = useQuery({
    queryKey: ['metricsMorosidad'],
    queryFn: async () => (await SuscripcionService.getMorosityMetrics()).data,
  });

  const { data: cancelacionStats, isLoading: loadCancelacion } = useQuery({
    queryKey: ['metricsCancelacionMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
  });

  const totalSuscripciones = cancelacionStats?.total_suscripciones || 0;
  const totalCanceladas = cancelacionStats?.total_canceladas || 0;
  const totalActivas = totalSuscripciones - totalCanceladas;

  // 5. Filtrado (Memoizado)
  const filteredSuscripciones = useMemo(() => {
    return suscripciones.filter(suscripcion => {
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        suscripcion.usuario?.nombre.toLowerCase().includes(term) ||
        suscripcion.usuario?.apellido.toLowerCase().includes(term) ||
        suscripcion.usuario?.email.toLowerCase().includes(term) ||
        suscripcion.proyectoAsociado?.nombre_proyecto.toLowerCase().includes(term) ||
        suscripcion.id.toString().includes(term);

      let matchesProject = true;
      if (filterProject !== 'all') {
        matchesProject = suscripcion.id_proyecto === Number(filterProject);
      }

      let matchesStatus = true;
      if (filterStatus === 'activas') matchesStatus = suscripcion.activo === true;
      if (filterStatus === 'inactivas') matchesStatus = suscripcion.activo === false;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [suscripciones, searchTerm, filterProject, filterStatus]);

  // 6. Mutaciones (Refactorizada)
  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelarAdmin(id),
    onSuccess: (_, variables) => { // variables es el ID enviado
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['metricsCancelacionMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });

      confirmDialog.close();

      // ✅ Activar efecto Flash en la fila modificada
      setHighlightedId(variables);
      setTimeout(() => setHighlightedId(null), 2500);

      showSuccess('Suscripción cancelada correctamente.');
    },
    onError: () => confirmDialog.close() // Solo cerrar modal, error sale global
  });

  // 7. Handlers
  const handleCancelarClick = (suscripcion: SuscripcionDto) => {
    if (!suscripcion.activo) return;
    confirmDialog.confirm('admin_cancel_subscription', suscripcion);
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'admin_cancel_subscription' && confirmDialog.data) {
      cancelarMutation.mutate(confirmDialog.data.id);
    }
  };

  const handleVerDetalle = (s: SuscripcionDto) => {
    setSelectedSuscripcion(s);
    detailModal.open();
  };

  const handleCerrarModal = () => {
    detailModal.close();
    setTimeout(() => setSelectedSuscripcion(null), 300);
  };

  // 8. Definición de Columnas
  const columns = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
    {
      id: 'usuario',
      label: 'ID / Usuario',
      minWidth: 240,
      render: (s) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{
            width: 36, height: 36,
            bgcolor: s.activo ? alpha(theme.palette.primary.main, 0.1) : theme.palette.action.disabledBackground,
            color: s.activo ? 'primary.main' : 'text.disabled',
            fontSize: 14, fontWeight: 'bold'
          }}>
            {s.usuario?.nombre?.charAt(0) || '#'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {s.usuario?.nombre} {s.usuario?.apellido}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.usuario?.email || 'Sin email'} • ID: {s.id}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 150,
      render: (s) => (
        <Typography variant="body2" fontWeight={500}>
          {s.proyectoAsociado?.nombre_proyecto}
        </Typography>
      )
    },
    {
      id: 'deuda',
      label: 'Estado Deuda',
      render: (s) => {
        // Lógica de semáforo para deuda
        let color: 'success' | 'warning' | 'error' = 'success';
        if (s.meses_a_pagar > 0) color = 'warning';
        if (s.meses_a_pagar >= 3) color = 'error'; // Alerta crítica

        return (
          <Chip
            label={s.meses_a_pagar === 0 ? 'Al día' : `${s.meses_a_pagar} cuota(s)`}
            size="small"
            color={color}
            variant={s.meses_a_pagar > 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, borderColor: 'divider' }}
          />
        );
      }
    },
    {
      id: 'pagado',
      label: 'Monto Pagado',
      render: (s) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
          ${Number(s.monto_total_pagado).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'tokens',
      label: 'Tokens',
      render: (s) => <Chip label={s.tokens_disponibles} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }} />
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (s) => (
        <Chip
          label={s.activo ? 'Activa' : 'Cancelada'}
          size="small"
          color={s.activo ? 'success' : 'default'}
          variant={s.activo ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (s) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Ver Detalle">
            <IconButton
              onClick={() => handleVerDetalle(s)}
              size="small"
              sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {s.activo && (
            <Tooltip title="Cancelar Suscripción">
              <IconButton
                onClick={() => handleCancelarClick(s)}
                disabled={cancelarMutation.isPending}
                size="small"
                sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    }
  ], [cancelarMutation.isPending, theme]);

  return (
    <PageContainer maxWidth="xl">

      <PageHeader
        title="Gestión de Suscripciones"
        subtitle="Monitor de suscripciones activas, canceladas y métricas clave"
      />

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Suscripciones Activas" />
        <Tab label="Cancelaciones" />
      </Tabs>

      <div role="tabpanel" hidden={tabIndex !== 0}>
        {tabIndex === 0 && (
          <Box>

            {/* ========== SECCIÓN DE KPIs ========== */}
            <Stack spacing={2} mb={4}>
              {/* FILA 1: Totales */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <StatCard title="Total Histórico" value={totalSuscripciones} icon={<Groups />} color="primary" loading={loadCancelacion} />
                <StatCard title="Activas Hoy" value={totalActivas} icon={<CheckCircle />} color="success" loading={loadCancelacion} />
                <StatCard title="Canceladas" value={totalCanceladas} icon={<Cancel />} color="error" loading={loadCancelacion} />
              </Stack>

              {/* FILA 2: Financiero */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <StatCard title="Tasa Cancelación" value={`${cancelacionStats?.tasa_cancelacion || 0}%`} icon={<TrendingDown />} color="warning" loading={loadCancelacion} />
                <StatCard title="Tasa Morosidad" value={`${morosidadStats?.tasa_morosidad || 0}%`} icon={<Warning />} color="error" loading={loadMorosidad} />
                <StatCard title="Total Generado" value={`$${Number(morosidadStats?.total_pagos_generados || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} icon={<MonetizationOn />} color="info" loading={loadMorosidad} />
              </Stack>
            </Stack>

            {/* ========== FILTROS ========== */}
            <Paper sx={{ p: 2, mb: 3 }} elevation={0} variant="outlined">
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  placeholder="Buscar por usuario o ID..."
                  size="small" sx={{ flexGrow: 1 }}
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>) }}
                />

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                <TextField
                  select label="Proyecto" size="small"
                  value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {proyectos.filter((p: any) => p.tipo_inversion === 'mensual').map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select label="Estado" size="small"
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="activas">Solo Activas</MenuItem>
                  <MenuItem value="inactivas">Solo Canceladas</MenuItem>
                  <MenuItem value="all">Todas</MenuItem>
                </TextField>
              </Stack>
            </Paper>

            {/* ========== TABLA ========== */}
            <QueryHandler isLoading={loadingSuscripciones} error={error as Error | null}>
              <DataTable
                columns={columns}
                data={filteredSuscripciones}
                getRowKey={(s) => s.id}

                // ✅ PROPS NUEVAS ACTIVADAS:
                highlightedRowId={highlightedId} // Flash visual
                isRowActive={(s) => s.activo}    // Opacidad para canceladas

                emptyMessage="No se encontraron suscripciones con los filtros actuales."
                pagination={true}
                defaultRowsPerPage={10}
              />
            </QueryHandler>

            {/* ========== MODALES ========== */}
            <DetalleSuscripcionModal
              open={detailModal.isOpen}
              onClose={handleCerrarModal}
              suscripcion={selectedSuscripcion}
            />

            <ConfirmDialog
              controller={confirmDialog}
              onConfirm={handleConfirmAction}
              isLoading={cancelarMutation.isPending}
            />

            {/* ✅ <Snackbar> manual eliminado */}

          </Box>
        )}
      </div>

      <div role="tabpanel" hidden={tabIndex !== 1}>
        {tabIndex === 1 && <CancelacionesTab />}
      </div>

    </PageContainer>
  );
};

export default AdminSuscripciones;