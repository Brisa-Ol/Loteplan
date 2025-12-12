// src/pages/Admin/Cancelaciones/AdminCancelaciones.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, InputAdornment, 
  Chip, IconButton, Tooltip, Stack, Avatar, LinearProgress 
} from '@mui/material';
import { 
  Search, Visibility, TrendingDown, MoneyOff, Cancel,
  Person as PersonIcon,
  DateRange as DateIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import type { SuscripcionCanceladaDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import DetalleCancelacionModal from './components/DetalleCancelacionModal';

// 👇 Importamos DataTable
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import SuscripcionService from '../../../Services/suscripcion.service';

// ✅ 1. Importamos el hook
import { useModal } from '../../../hooks/useModal';

// ... (StatCard se mantiene igual) ...
const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  sub?: string; 
  color: string; 
  icon: React.ReactNode;
  loading?: boolean; 
}> = ({ title, value, sub, color, icon, loading }) => (
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
        <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
      )}
      <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
      {sub && !loading && (
        <Typography variant="caption" color={`${color}.main`} fontWeight="bold" sx={{ mt: 0.5, display: 'block' }}>
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
);

const AdminCancelaciones: React.FC = () => {
  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // ✅ 2. Usamos el hook y mantenemos el estado de datos separado
  const detailModal = useModal();
  const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

  // --- QUERIES --- (Igual que antes)
  const { data: cancelaciones = [], isLoading, error } = useQuery({
    queryKey: ['adminCancelaciones'],
    queryFn: async () => (await SuscripcionService.getAllCanceladas()).data,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['adminCancelacionesMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
  });

  // --- CÁLCULOS --- (Igual que antes)
  const totalMontoLiquidado = useMemo(() => {
    return cancelaciones.reduce((acc, curr) => acc + Number(curr.monto_pagado_total), 0);
  }, [cancelaciones]);

  const filteredCancelaciones = useMemo(() => {
    return cancelaciones.filter(item => {
      const term = searchTerm.toLowerCase();
      
      const userName = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : '';
      const userEmail = item.usuario?.email || '';
      const projectName = item.proyecto?.nombre_proyecto || '';
      
      const matchesSearch = 
        userName.toLowerCase().includes(term) ||
        userEmail.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        item.id.toString().includes(term);

      let matchesDate = true;
      if (dateStart || dateEnd) {
        const itemDate = new Date(item.fecha_cancelacion);
        if (dateStart && itemDate < new Date(dateStart)) matchesDate = false;
        if (dateEnd) {
          const endDate = new Date(dateEnd);
          endDate.setHours(23, 59, 59);
          if (itemDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [cancelaciones, searchTerm, dateStart, dateEnd]);

  // ✅ 3. Handler para ver detalle
  const handleVerDetalle = (item: SuscripcionCanceladaDto) => {
    setSelectedCancelacion(item);
    detailModal.open();
  };

  const handleCerrarModal = () => {
    detailModal.close();
    setSelectedCancelacion(null);
  };

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ========================================================================
  const columns: DataTableColumn<SuscripcionCanceladaDto>[] = [
    {
      id: 'id',
      label: 'ID / Fecha Baja',
      minWidth: 150,
      render: (item) => (
        <Box>
            <Typography variant="body2" fontWeight={600}>#{item.id}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                    {new Date(item.fecha_cancelacion).toLocaleDateString('es-AR')}
                </Typography>
            </Stack>
        </Box>
      )
    },
    {
      id: 'usuario',
      label: 'Ex-Usuario',
      minWidth: 200,
      render: (item) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'error.light', color: 'error.main', fontSize: 14 }}>
                {item.usuario?.nombre?.charAt(0) || <PersonIcon />}
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={600}>
                    {item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario eliminado'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {item.usuario?.email || `ID Original: ${item.id_usuario}`}
                </Typography>
            </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      render: (item) => (
        <Typography variant="body2" fontWeight={500}>
            {item.proyecto?.nombre_proyecto || `ID Proyecto: ${item.id_proyecto}`}
        </Typography>
      )
    },
    {
      id: 'meses',
      label: 'Pagado',
      render: (item) => (
        <Chip 
            label={`${item.meses_pagados} cuotas`} 
            size="small" 
            variant="outlined" 
            color="default"
        />
      )
    },
    {
      id: 'monto',
      label: 'Monto Liq.',
      render: (item) => (
        <Typography variant="body2" fontWeight={700} color="error.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(item.monto_pagado_total).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (item) => (
        <Tooltip title="Ver Detalle de Cancelación">
            <IconButton 
            size="small" 
            color="primary" 
            // ✅ Usamos el handler actualizado
            onClick={() => handleVerDetalle(item)}
            >
            <Visibility />
            </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      
      <PageHeader
        title="Historial de Cancelaciones"
        subtitle="Monitor de bajas, devoluciones y métricas de retención"
      />

      {/* ========== 1. KPIs ========== */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
        gap: 2, mb: 4 
      }}>
        <StatCard 
          title="Total Cancelaciones" 
          value={metrics?.total_canceladas.toString() || '0'} 
          sub={`De ${metrics?.total_suscripciones || 0} totales`}
          color="error" icon={<Cancel />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Tasa de Cancelación (Churn)" 
          value={`${metrics?.tasa_cancelacion || '0'}%`} 
          color="warning" icon={<TrendingDown />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Monto Total Liquidado" 
          value={`$${totalMontoLiquidado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="info" icon={<MoneyOff />}
          loading={isLoading}
        />
      </Box>

      {/* ========== 2. FILTROS (Toolbar) ========== */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar (Usuario, Proyecto, ID...)" 
            size="small" 
            sx={{ flex: 2 }}
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
          />
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, width: '100%' }}>
            <TextField 
              type="date" size="small" fullWidth 
              label="Desde" InputLabelProps={{ shrink: true }}
              value={dateStart} onChange={(e) => setDateStart(e.target.value)} 
            />
            <TextField 
              type="date" size="small" fullWidth 
              label="Hasta" InputLabelProps={{ shrink: true }}
              value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} 
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ========== 3. TABLA (Datatable) ========== */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={filteredCancelaciones}
            getRowKey={(row) => row.id}
            emptyMessage="No se encontraron cancelaciones con los filtros actuales."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ========== MODAL CON USEMODAL ========== */}
      <DetalleCancelacionModal 
        open={detailModal.isOpen} // ✅ Usamos isOpen del hook
        onClose={handleCerrarModal} // ✅ Función que cierra y limpia
        cancelacion={selectedCancelacion}
      />
    </PageContainer>
  );
};

export default AdminCancelaciones;