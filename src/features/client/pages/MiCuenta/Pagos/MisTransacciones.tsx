// src/features/client/pages/Transacciones/MisTransacciones.tsx

import {
  Block,
  CheckCircle, ErrorOutline, HelpOutline, HourglassEmpty,
  MonetizationOn, Refresh, Schedule, Search,
  TimerOff,
  Warning
} from '@mui/icons-material';
import {
  Badge, Box, Chip, InputAdornment, Paper,
  Stack, Tab, Tabs, TextField, Tooltip, Typography, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, type JSX } from 'react';
// Hooks y Servicios
import TransaccionService from '@/core/api/services/transaccion.service';
import { env } from '@/core/config/env';
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { DataTable, PageContainer, PageHeader, QueryHandler, StatCard, type DataTableColumn } from '@/shared';

// =====================================================
// CONFIGURACIÓN DE ESTADOS
// =====================================================

type ChipColor = 'success' | 'info' | 'warning' | 'error' | 'default';

const getStatusConfig = (estado: string): { label: string; color: ChipColor; icon: JSX.Element } => {
  const configs: Record<string, { label: string; color: ChipColor; icon: JSX.Element }> = {
    pagado: { label: 'Completado', color: 'success', icon: <CheckCircle fontSize="small" /> },
    pendiente: { label: 'Pendiente', color: 'info', icon: <Schedule fontSize="small" /> },
    en_proceso: { label: 'En Proceso', color: 'warning', icon: <HourglassEmpty fontSize="small" /> },
    fallido: { label: 'Fallido', color: 'error', icon: <ErrorOutline fontSize="small" /> },
    expirado: { label: 'Expirado', color: 'default', icon: <TimerOff fontSize="small" /> },
    reembolsado: { label: 'Reembolsado', color: 'info', icon: <Refresh fontSize="small" /> },
    rechazado_proyecto_cerrado: { label: 'Proy. Cerrado', color: 'error', icon: <Block fontSize="small" /> },
    rechazado_por_capacidad: { label: 'Cupo Lleno', color: 'error', icon: <Block fontSize="small" /> },
  };

  return configs[estado] || { label: estado.toUpperCase(), color: 'default', icon: <HelpOutline fontSize="small" /> };
};

const getTipoLabel = (tipo: string) => {
  switch (tipo) {
    case 'mensual': return 'CUOTA MENSUAL';
    case 'directo': return 'INVERSIÓN DIRECTA';
    case 'pago_suscripcion_inicial': return 'SUSCRIPCIÓN INICIAL';
    case 'Puja': return 'PUJA / SUBASTA';
    default: return tipo.replace('_', ' ').toUpperCase();
  }
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const MisTransacciones: React.FC = () => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter(); // ✅ 2 decimales ($16.29)

  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. CARGA DE DATOS
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['misTransacciones'],
    queryFn: async () => (await TransaccionService.getMyTransactions()).data,
  });

  // 2. FILTRADO Y MÉTRICAS
  const { filteredData, counts, totalOperado } = useMemo(() => {
    const counts = { todas: transacciones.length, exitosas: 0, problemas: 0 };
    let totalOperado = 0;

    const filtered = transacciones.filter(t => {
      const isExito = t.estado_transaccion === 'pagado';
      const isProblema = ['fallido', 'expirado', 'rechazado_proyecto_cerrado', 'rechazado_por_capacidad'].includes(t.estado_transaccion);

      if (isExito) {
        counts.exitosas++;
        totalOperado += Number(t.monto);
      } else if (isProblema || t.estado_transaccion === 'pendiente' || t.estado_transaccion === 'en_proceso') {
        counts.problemas++;
      }

      if (currentTab === 1 && !isExito) return false;
      if (currentTab === 2 && isExito) return false;

      const search = searchTerm.toLowerCase();
      return (
        t.proyectoTransaccion?.nombre_proyecto?.toLowerCase().includes(search) ||
        t.id.toString().includes(search)
      );
    }).sort((a, b) => new Date(b.fecha_transaccion).getTime() - new Date(a.fecha_transaccion).getTime());

    return { filteredData: filtered, counts, totalOperado };
  }, [transacciones, currentTab, searchTerm]);

  // 3. COLUMNAS (Sin datos técnicos confusos)
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    {
      id: 'fecha', label: 'Fecha / Referencia', minWidth: 160,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {new Date(row.fecha_transaccion).toLocaleDateString(env.defaultLocale)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
            {new Date(row.fecha_transaccion).toLocaleTimeString(env.defaultLocale, { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Operación: #{row.id}
          </Typography>
        </Box>
      )
    },
    {
      id: 'concepto', label: 'Inversión y Detalle', minWidth: 260,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {row.proyectoTransaccion?.nombre_proyecto || 'Proyecto General'}
          </Typography>
          <Stack direction="row" spacing={0.5} mt={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {getTipoLabel(row.tipo_transaccion)}
            </Typography>
            {row.pagoMensual && (
              <Chip
                label={`Mes ${row.pagoMensual.mes}`}
                size="small"
                variant="outlined"
                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }}
              />
            )}
          </Stack>
        </Box>
      )
    },
    {
      id: 'monto', label: 'Importe', align: 'right', minWidth: 120,
      render: (row) => (
        <Typography
          variant="subtitle2"
          fontWeight={800}
          color={row.estado_transaccion === 'pagado' ? 'success.main' : 'text.primary'}
        >
          {formatCurrency(row.monto)}
        </Typography>
      )
    },
    {
      id: 'estado', label: 'Estado', align: 'center', minWidth: 140,
      render: (row) => {
        const { label, color, icon } = getStatusConfig(row.estado_transaccion);
        return (
          <Tooltip title={row.error_detalle || ''} arrow>
            <Chip
              label={label}
              color={color}
              size="small"
              icon={icon}
              sx={{ fontWeight: 700, minWidth: 110 }}
            />
          </Tooltip>
        );
      }
    }
  ], [formatCurrency]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Movimientos" subtitle="Historial de transacciones y estados de pago." />

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3} mb={4}>
        <StatCard title="Capital Operado" value={formatCurrency(totalOperado)} icon={<MonetizationOn />} color="success" loading={isLoading} />
        <StatCard title="Completadas" value={counts.exitosas.toString()} icon={<CheckCircle />} color="info" loading={isLoading} />
        <StatCard title="Pendientes / Otros" value={counts.problemas.toString()} icon={<Warning />} color="error" loading={isLoading} />
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} indicatorColor="primary" textColor="primary">
          <Tab label={`Todas (${counts.todas})`} />
          <Tab label="Exitosas" />
          <Tab label={<Badge badgeContent={counts.problemas} color="error" sx={{ px: 1 }}>Alertas</Badge>} />
        </Tabs>
        <TextField
          placeholder="Buscar proyecto..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 280, bgcolor: 'background.paper', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
      </Stack>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={filteredData}
            getRowKey={(row) => row.id}
            pagination
            emptyMessage="No se registraron movimientos en este periodo."
          />
        </Paper>
      </QueryHandler>
    </PageContainer>
  );
};

export default MisTransacciones;