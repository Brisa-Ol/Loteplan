import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, InputAdornment,
  Chip, IconButton, Tooltip, Stack, Avatar, Divider, useTheme, alpha
} from '@mui/material';
import {
  Search, Visibility, TrendingDown, MoneyOff, Cancel,
  Person as PersonIcon,
  DateRange as DateIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useModal } from '@/shared/hooks/useModal';
import type { SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard'; // ✅ Importación Premium
import DetalleCancelacionModal from './DetalleCancelacionModal';

const CancelacionesTab: React.FC = () => {
  const theme = useTheme();

  // 1. Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // 2. Estado de Modal y Selección
  const detailModal = useModal();
  const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

  // 3. Queries
  const { data: cancelaciones = [], isLoading, error } = useQuery({
    queryKey: ['adminCancelaciones'],
    queryFn: async () => (await SuscripcionService.getAllCanceladas()).data,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['adminCancelacionesMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
  });

  // 4. Cálculos
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

  const handleVerDetalle = useCallback((item: SuscripcionCanceladaDto) => {
    setSelectedCancelacion(item);
    detailModal.open();
  }, [detailModal]);

  const handleCerrarModal = useCallback(() => {
    detailModal.close();
    setTimeout(() => setSelectedCancelacion(null), 300);
  }, [detailModal]);

  // 6. Columnas
  const columns = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => [
    {
      id: 'id',
      label: 'ID / Fecha',
      minWidth: 140,
      render: (item) => (
        <Box>
          <Typography variant="body2" fontWeight={800}>#{item.id}</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {new Date(item.fecha_cancelacion).toLocaleDateString('es-AR')}
            </Typography>
          </Stack>
        </Box>
      )
    },
    {
      id: 'usuario',
      label: 'Ex-Usuario',
      minWidth: 220,
      render: (item) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{
            width: 36, height: 36,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: 'error.main',
            borderRadius: 1, // 8px
            fontSize: 14,
            fontWeight: 800
          }}>
            {item.usuario?.nombre?.charAt(0) || <PersonIcon fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}`.toUpperCase() : 'USUARIO ELIMINADO'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 180, fontWeight: 500 }}>
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
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {item.proyecto?.nombre_proyecto || `ID PROYECTO: ${item.id_proyecto}`}
        </Typography>
      )
    },
    {
      id: 'meses',
      label: 'Permanencia',
      render: (item) => (
        <Chip
          label={`${item.meses_pagados} MESES`}
          size="small"
          sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1 }}
        />
      )
    },
    {
      id: 'monto',
      label: 'Liquidado',
      render: (item) => (
        <Typography variant="body2" fontWeight={800} color="error.main" sx={{ fontFamily: 'monospace' }}>
          ${Number(item.monto_pagado_total).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Info',
      align: 'right',
      render: (item) => (
        <Tooltip title="Ver Detalle de Liquidación">
          <IconButton
            size="small"
            onClick={() => handleVerDetalle(item)}
            sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme, handleVerDetalle]);

  return (
    <Box>
      {/* ========== 1. KPIs PREMIUM ========== */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2.5, mb: 4
      }}>
        <StatCard
          title="Total Cancelaciones"
          value={metrics?.total_canceladas || 0}
          subtitle={`De ${metrics?.total_suscripciones || 0} suscripciones`}
          color="error"
          icon={<Cancel />}
          loading={loadingMetrics}
        />
        <StatCard
          title="Tasa de Churn"
          value={`${metrics?.tasa_cancelacion || 0}%`}
          color="warning"
          icon={<TrendingDown />}
          subtitle="Tasa de abandono"
          loading={loadingMetrics}
        />
        <StatCard
          title="Total Liquidado"
          value={`$${totalMontoLiquidado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          color="info" // ✅ Se verá Naranja según el mapeo del tema
          icon={<MoneyOff />}
          subtitle="Capital devuelto"
          loading={isLoading}
        />
      </Box>

      {/* ========== 2. FILTROS REFINADOS ========== */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5, mb: 3,
          borderRadius: 2, // 16px
          border: '1px solid',
          borderColor: theme.palette.secondary.main,
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(8px)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por usuario, email o proyecto..."
            size="small"
            sx={{
              flex: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 1 }
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
          />

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1.2, width: '100%' }}>
            <TextField
              type="date" size="small" fullWidth
              label="Desde" InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              value={dateStart} onChange={(e) => setDateStart(e.target.value)}
            />
            <TextField
              type="date" size="small" fullWidth
              label="Hasta" InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ========== 3. TABLA DE DATOS ========== */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
          columns={columns}
          data={filteredCancelaciones}
          getRowKey={(row) => row.id}
          emptyMessage="No se encontraron registros de cancelaciones."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ========== MODALES ========== */}
      <DetalleCancelacionModal
        open={detailModal.isOpen}
        onClose={handleCerrarModal}
        cancelacion={selectedCancelacion}
      />
    </Box>
  );
};

export default CancelacionesTab;