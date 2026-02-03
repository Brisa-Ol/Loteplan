import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Stack, Chip, Button, Tooltip, 
  Tabs, Tab, Badge, TextField, InputAdornment,
  Paper, useTheme, alpha
} from '@mui/material';
import { 
  TrendingUp, EventRepeat, Gavel, CheckCircle, 
  Search, MonetizationOn, Warning, SwapHoriz, ReceiptLong
} from '@mui/icons-material';

// Componentes Compartidos
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '@/shared/components/layout/headers/PageHeader';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';

// Hooks y Servicios
import useSnackbar from '@/shared/hooks/useSnackbar';
import TransaccionService from '@/core/api/services/transaccion.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';


// Tipos
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';
import type { ApiError } from '@/core/api/httpService';
import { env } from '@/core/config/env';
import { getStatusConfig } from '../../utils/inversionStatus';

// =====================================================
// HELPERS DE CONFIGURACIÓN
// =====================================================

const getTypeConfig = (tipo: string) => {
  switch (tipo) {
    case 'directo': return { icon: <TrendingUp fontSize="small" />, color: 'info' as const, label: 'Inversión' };
    case 'mensual': return { icon: <EventRepeat fontSize="small" />, color: 'secondary' as const, label: 'Cuota' };
    case 'pago_suscripcion_inicial': return { icon: <ReceiptLong fontSize="small" />, color: 'primary' as const, label: 'Suscripción' };
    case 'Puja': return { icon: <Gavel fontSize="small" />, color: 'warning' as const, label: 'Subasta' };
    default: return { icon: <SwapHoriz fontSize="small" />, color: 'default' as const, label: 'Operación' };
  }
};

// =====================================================
// COMPONENTES DE CELDA (MEMOIZADOS)
// =====================================================

const DateCell = React.memo<{ fecha: string; id: number }>(({ fecha, id }) => {
  const theme = useTheme();
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {new Date(fecha).toLocaleDateString(env.defaultLocale)}
      </Typography>
      <Chip 
        label={`REF: #${id}`} 
        size="small" 
        sx={{ 
          height: 20, fontSize: '0.65rem', fontFamily: 'monospace', mt: 0.5,
          bgcolor: alpha(theme.palette.secondary.main, 0.1) 
        }} 
      />
    </Box>
  );
});

const ConceptCell = React.memo<{ 
  nombreProyecto: string;
  tipoTransaccion: string;
  pagoMensual?: { mes: number } | null;
}>(({ nombreProyecto, tipoTransaccion, pagoMensual }) => {
  const conf = getTypeConfig(tipoTransaccion);
  const detalle = (tipoTransaccion === 'mensual' && pagoMensual) 
    ? `Cuota #${pagoMensual.mes}` 
    : conf.label;

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} noWrap color="text.primary">
        {nombreProyecto}
      </Typography>
      <Chip 
        label={detalle} 
        size="small" 
        variant="outlined" 
        color={conf.color} 
        icon={conf.icon}
        sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600, borderRadius: 1, mt: 0.5 }} 
      />
    </Box>
  );
});

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const MisTransacciones: React.FC = () => {
  const theme = useTheme();
  const { showError } = useSnackbar();
  const formatCurrency = useCurrencyFormatter();

  const [currentTab, setCurrentTab] = useState(0); 
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // 1. DATA FETCHING
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['misTransacciones'],
    queryFn: async () => (await TransaccionService.getMyTransactions()).data,
    staleTime: 5 * 60 * 1000,
  });

  // 2. MUTATION (REINTENTO DE PAGO)
  const retryMutation = useMutation({
    mutationFn: async (idTransaccion: number) => {
      setHighlightedId(idTransaccion);
      return await MercadoPagoService.createCheckoutGenerico({ id_transaccion: idTransaccion });
    },
    onSuccess: (res) => {
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
    },
    onError: (err: unknown) => {
      setHighlightedId(null);
      showError((err as ApiError).message || "Error al regenerar checkout.");
    }
  });

  const handleRetry = useCallback((id: number) => retryMutation.mutate(id), [retryMutation]);

  // 3. LÓGICA DE FILTRADO Y STATS (MEMOIZADA)
  const { filteredData, counts, totalExitoso } = useMemo(() => {
    const counts = { todas: transacciones.length, exitosas: 0, problemas: 0 };
    let totalExitoso = 0;

    const filtered = transacciones.filter(t => {
      const isExito = t.estado_transaccion === 'pagado';
      const isProblema = ['pendiente', 'fallido', 'expirado', 'rechazado_por_capacidad'].includes(t.estado_transaccion);

      if (isExito) {
        counts.exitosas++;
        totalExitoso += Number(t.monto);
      } else if (isProblema) {
        counts.problemas++;
      }

      // Filtro de Tabs
      if (currentTab === 1 && !isExito) return false;
      if (currentTab === 2 && !isProblema && t.estado_transaccion !== 'en_proceso') return false;

      // Filtro de Búsqueda
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return (
          t.proyectoTransaccion?.nombre_proyecto?.toLowerCase().includes(lowerTerm) ||
          t.id.toString().includes(lowerTerm) ||
          t.monto.toString().includes(lowerTerm)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.fecha_transaccion).getTime() - new Date(a.fecha_transaccion).getTime());

    return { filteredData: filtered, counts, totalExitoso };
  }, [transacciones, currentTab, searchTerm]);

  // 4. COLUMNAS DE LA TABLA
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    { 
      id: 'fecha', label: 'Fecha / Ref', minWidth: 160,
      render: (row) => <DateCell fecha={row.fecha_transaccion} id={row.id} />
    },
    { 
      id: 'descripcion', label: 'Concepto', minWidth: 240,
      render: (row) => (
        <ConceptCell
          nombreProyecto={row.proyectoTransaccion?.nombre_proyecto || 'Sin Proyecto Asociado'}
          tipoTransaccion={row.tipo_transaccion}
          pagoMensual={row.pagoMensual}
        />
      )
    },
    { 
      id: 'monto', label: 'Importe', align: 'right', minWidth: 120,
      render: (row) => (
        <Typography variant="subtitle2" fontWeight={800} color={row.estado_transaccion === 'pagado' ? 'success.main' : 'text.primary'}>
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
              label={label} color={color} size="small" icon={icon}
              variant={row.estado_transaccion === 'pagado' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700 }}
            />
          </Tooltip>
        );
      }
    },
    { 
      id: 'acciones', label: 'Acción', align: 'right', minWidth: 120,
      render: (row) => {
        const isPending = ['pendiente', 'fallido', 'expirado', 'en_proceso'].includes(row.estado_transaccion);
        if (!isPending) return null;

        return (
          <Button 
            variant="contained" size="small" disableElevation
            disabled={retryMutation.isPending}
            onClick={() => handleRetry(row.id)}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', minWidth: 90 }}
          >
            {retryMutation.isPending && highlightedId === row.id ? '...' : 'Pagar'}
          </Button>
        );
      }
    }
  ], [formatCurrency, retryMutation.isPending, highlightedId, handleRetry]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Transacciones" subtitle="Consulta el historial y estado de tus pagos." />

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3} mb={4}>
        <StatCard title="Total Operado" value={formatCurrency(totalExitoso)} icon={<MonetizationOn />} color="primary" loading={isLoading} />
        <StatCard title="Operaciones OK" value={counts.exitosas.toString()} icon={<CheckCircle />} color="success" loading={isLoading} />
        <StatCard title="Pendientes" value={counts.problemas.toString()} icon={<Warning />} color={counts.problemas > 0 ? "error" : "info"} loading={isLoading} />
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} textColor="primary" indicatorColor="primary">
          <Tab label={`Todas (${counts.todas})`} />
          <Tab label="Exitosas" />
          <Tab label={<Badge badgeContent={counts.problemas} color="error" sx={{ px: 1 }}>Pendientes</Badge>} />
        </Tabs>

        <TextField
          placeholder="Buscar proyecto..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 250, bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Stack>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <DataTable 
            columns={columns} data={filteredData} getRowKey={(row) => row.id} 
            pagination defaultRowsPerPage={10} highlightedRowId={highlightedId}
            emptyMessage="No se encontraron movimientos con los filtros seleccionados."
          />
        </Paper>
      </QueryHandler>
    </PageContainer>
  );
};

export default MisTransacciones;