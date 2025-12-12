// src/pages/Admin/Suscripciones/AdminSuscripciones.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, TextField, MenuItem, InputAdornment, LinearProgress, Avatar
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
import DetalleSuscripcionModal from './components/DetalleSuscripcionModal';

// 👇 Importamos DataTable
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import SuscripcionService from '../../../Services/suscripcion.service';
import ProyectoService from '../../../Services/proyecto.service';

// ✅ 1. Importamos el hook
import { useModal } from '../../../hooks/useModal';

// ... (StatCard se mantiene igual) ...
const StatCard: React.FC<{ 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => (
  <Paper elevation={0} sx={{ 
    p: 2, display: 'flex', alignItems: 'center', gap: 2, 
    bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider',
    flex: 1, minWidth: 0
  }}>
    <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
      {icon}
    </Box>
    <Box sx={{ width: '100%' }}>
      {loading ? (
        <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
      ) : (
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
      )}
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
    </Box>
  </Paper>
);

const AdminSuscripciones: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activas' | 'inactivas'>('activas');
  
  // ✅ 2. Usamos el hook para el modal
  const detailModal = useModal();
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);

  // ... (Queries y cálculos de morosidadStats, cancelacionStats, totalSuscripciones, etc. se mantienen igual) ...
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

  // Filtrado de la tabla (igual)
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

  // Acciones (cancelar se mantiene igual)
  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelarAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['metricsCancelacionMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });
      alert('✅ Suscripción cancelada correctamente.');
    },
    onError: (err: any) => {
      const backendError = err.response?.data?.error || 'Error desconocido';
      alert(`❌ No se pudo cancelar:\n${backendError}`);
    }
  });

  const handleCancelar = (suscripcion: SuscripcionDto) => {
    if (!suscripcion.activo) return;
    if (window.confirm(`¿Confirmar cancelación de la suscripción #${suscripcion.id}? Esto generará una deuda y anulará el acceso al lote.`)) {
      cancelarMutation.mutate(suscripcion.id);
    }
  };

  // ✅ 3. Handlers para el modal usando el hook
  const handleVerDetalle = (s: SuscripcionDto) => {
    setSelectedSuscripcion(s);
    detailModal.open();
  };

  const handleCerrarModal = () => {
    detailModal.close();
    setSelectedSuscripcion(null);
  };

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ========================================================================
  const columns: DataTableColumn<SuscripcionDto>[] = [
    {
      id: 'usuario',
      label: 'ID / Usuario',
      minWidth: 250,
      render: (s) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 14 }}>
                {s.usuario?.nombre?.charAt(0) || '#'}
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={600}>
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
      render: (s) => (
        <Chip 
            label={s.meses_a_pagar === 0 ? 'Al día' : `${s.meses_a_pagar} pendiente(s)`}
            size="small"
            color={s.meses_a_pagar > 0 ? 'warning' : 'success'}
            variant={s.meses_a_pagar > 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
        />
      )
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
      render: (s) => <Chip label={s.tokens_disponibles} size="small" variant="outlined" color="default" />
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
                    color="primary" 
                    // ✅ Usamos el handler actualizado
                    onClick={() => handleVerDetalle(s)} 
                    size="small"
                >
                    <Visibility />
                </IconButton>
            </Tooltip>

            {s.activo && (
                <Tooltip title="Cancelar Suscripción">
                    <IconButton 
                        color="error" 
                        onClick={() => handleCancelar(s)}
                        disabled={cancelarMutation.isPending}
                        size="small"
                    >
                        <Cancel />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      
      <PageHeader
        title="Gestión de Suscripciones"
        subtitle="Monitor de suscripciones activas, canceladas y métricas clave"
      />

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

      {/* ========== FILTROS (Toolbar) ========== */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar por usuario o ID..." 
            size="small" sx={{ flexGrow: 1 }}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action"/></InputAdornment>) }}
          />
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

      {/* ========== TABLA (Datatable) ========== */}
      <QueryHandler isLoading={loadingSuscripciones} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={filteredSuscripciones}
            getRowKey={(s) => s.id}
            emptyMessage="No se encontraron suscripciones con los filtros actuales."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ========== MODAL CON USEMODAL ========== */}
      <DetalleSuscripcionModal 
        open={detailModal.isOpen} // ✅
        onClose={handleCerrarModal} // ✅
        suscripcion={selectedSuscripcion}
      />

    </PageContainer>
  );
};

export default AdminSuscripciones;