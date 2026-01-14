// src/pages/client/MiCuenta/Pagos/MisTransacciones.tsx

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Stack, Chip, Button, Tooltip, 
  Tabs, Tab, Badge, TextField, InputAdornment,
  Paper, useTheme, alpha
} from '@mui/material';
import { 
  TrendingUp, EventRepeat, Gavel, CheckCircle, 
  ErrorOutline, HourglassEmpty, Refresh, ReceiptLong, Info,
  Search, MonetizationOn, Warning, SwapHoriz
} from '@mui/icons-material';

// Servicios y Tipos
import type { TransaccionDto } from '../../../../types/dto/transaccion.dto';
import type { ApiError } from '../../../../services/httpService';
import TransaccionService from '../../../../services/transaccion.service';
import MercadoPagoService from '../../../../services/pagoMercado.service';

// Contexto y Configuración
import { env } from '../../../../config/env';
import { useSnackbar } from '../../../../context/SnackbarContext';

// Componentes Comunes
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../../shared/components/domain/cards/StatCard/StatCard';

const MisTransacciones: React.FC = () => {
  const theme = useTheme();
  const { showError } = useSnackbar();

  // 1. Estados de Filtros y UI
  const [currentTab, setCurrentTab] = useState(0); // 0: Todas, 1: Exitosas, 2: Pendientes/Fallidas
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // 2. Carga de Datos
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['misTransacciones'],
    queryFn: async () => (await TransaccionService.getMyTransactions()).data,
    refetchOnWindowFocus: false,
  });

  // 3. Mutación Retry (Reintentar Pago)
  const retryMutation = useMutation({
    mutationFn: async (idTransaccion: number) => {
      setHighlightedId(idTransaccion); // Feedback visual inmediato
      return await MercadoPagoService.createCheckoutGenerico({ id_transaccion: idTransaccion });
    },
    onSuccess: (res) => {
      // Redirigir a MercadoPago si hay URL
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      setHighlightedId(null);
      showError(apiError.message || "Error al regenerar checkout.");
    }
  });

  // 4. Lógica de Filtrado y KPIs (Memoizada)
  const { filteredData, counts, stats } = useMemo(() => {
    let data = [...transacciones];

    // A. Contadores Globales (KPIs)
    const totalCounts = {
      todas: transacciones.length,
      exitosas: transacciones.filter(t => t.estado_transaccion === 'pagado').length,
      problemas: transacciones.filter(t => ['pendiente', 'fallido', 'expirado', 'rechazado_por_capacidad'].includes(t.estado_transaccion)).length
    };

    // B. Estadísticas Financieras
    const totalAmount = transacciones
        .filter(t => t.estado_transaccion === 'pagado')
        .reduce((acc, curr) => acc + Number(curr.monto), 0);

    // C. Filtrado por Texto
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.proyectoTransaccion?.nombre_proyecto?.toLowerCase().includes(lowerTerm) ||
        t.monto.toString().includes(lowerTerm) || 
        t.id.toString().includes(lowerTerm)
      );
    }

    // D. Filtrado por Tab
    if (currentTab === 1) { // Exitosas
      data = data.filter(t => t.estado_transaccion === 'pagado');
    } else if (currentTab === 2) { // Problemas
      data = data.filter(t => ['pendiente', 'fallido', 'expirado', 'rechazado_por_capacidad', 'en_proceso'].includes(t.estado_transaccion));
    }

    // E. Ordenamiento (Más reciente primero)
    data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    return { 
        filteredData: data, 
        counts: totalCounts,
        stats: { totalAmount }
    };
  }, [transacciones, currentTab, searchTerm]);

  // --- HELPERS VISUALES ---
  
  const getTypeConfig = (tipo: string) => {
    switch (tipo) {
      case 'directo': return { icon: <TrendingUp fontSize="small" />, color: 'info' as const, label: 'Inversión' };
      case 'mensual': return { icon: <EventRepeat fontSize="small" />, color: 'secondary' as const, label: 'Cuota' };
      case 'pago_suscripcion_inicial': return { icon: <ReceiptLong fontSize="small" />, color: 'primary' as const, label: 'Suscripción' };
      case 'Puja': return { icon: <Gavel fontSize="small" />, color: 'warning' as const, label: 'Subasta' };
      default: return { icon: <SwapHoriz fontSize="small" />, color: 'default' as const, label: 'Operación' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pagado': return { color: 'success' as const, label: 'Pagado', icon: <CheckCircle /> };
      case 'pendiente': 
      case 'en_proceso': return { color: 'warning' as const, label: 'Pendiente', icon: <HourglassEmpty /> };
      case 'fallido': 
      case 'rechazado_por_capacidad': 
      case 'rechazado_proyecto_cerrado': return { color: 'error' as const, label: 'Fallido', icon: <ErrorOutline /> };
      case 'expirado': return { color: 'error' as const, label: 'Expirado', icon: <ErrorOutline /> };
      case 'reembolsado': return { color: 'info' as const, label: 'Reembolsado', icon: <Refresh /> };
      default: return { color: 'default' as const, label: status, icon: <Info /> };
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

  // --- COLUMNAS DE LA TABLA ---
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    { 
      id: 'fecha', label: 'Fecha', minWidth: 140,
      render: (row) => {
        const date = new Date(row.fecha_transaccion ?? row.createdAt);
        return (
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
                {date.toLocaleDateString(env.defaultLocale)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {date.toLocaleTimeString(env.defaultLocale, {hour: '2-digit', minute:'2-digit'})}
            </Typography>
          </Box>
        );
      }
    },
    { 
      id: 'descripcion', label: 'Detalle', minWidth: 220,
      render: (row) => {
        const nombreProyecto = row.proyectoTransaccion?.nombre_proyecto || 'Sin Proyecto';
        let detalle = '';
        
        if (row.tipo_transaccion === 'mensual' && row.pagoMensual) detalle = `Cuota #${row.pagoMensual.mes}`;
        else if (row.tipo_transaccion === 'pago_suscripcion_inicial') detalle = 'Suscripción Inicial';
        else if (row.tipo_transaccion === 'directo') detalle = 'Inversión Directa';
        else if (row.tipo_transaccion === 'Puja') detalle = 'Pago de Subasta';

        const conf = getTypeConfig(row.tipo_transaccion);

        return (
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap color="text.primary">{nombreProyecto}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Chip 
                    label={detalle || conf.label} 
                    size="small" 
                    variant="outlined" 
                    color={conf.color} 
                    icon={conf.icon}
                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600, borderRadius: 1 }} 
                />
            </Stack>
          </Box>
        );
      }
    },
    { 
      id: 'monto', label: 'Monto', align: 'right', minWidth: 120,
      render: (row) => (
        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ fontFamily: 'monospace' }}>
            {formatCurrency(Number(row.monto))}
        </Typography>
      )
    },
    { 
      id: 'estado', label: 'Estado', align: 'center', minWidth: 130,
      render: (row) => {
        const conf = getStatusConfig(row.estado_transaccion);
        return (
            <Tooltip title={row.error_detalle || ''} arrow placement="top">
                <Chip 
                    label={conf.label} 
                    color={conf.color} 
                    size="small" 
                    variant="filled" 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    icon={conf.icon as any}
                    sx={{ fontWeight: 600 }}
                />
            </Tooltip>
        );
      }
    },
    { 
      id: 'acciones', label: 'Acción', align: 'right', minWidth: 120,
      render: (row) => {
        const canRetry = ['pendiente', 'fallido', 'expirado', 'en_proceso', 'rechazado_por_capacidad'].includes(row.estado_transaccion);
        
        if (!canRetry) return <Box minWidth={100} />;

        // Si se está reintentando ESTA fila específica
        const isThisLoading = retryMutation.isPending && highlightedId === row.id;

        return (
          <Button 
            variant="contained" 
            size="small" 
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate(row.id)}
            color={['pendiente', 'en_proceso'].includes(row.estado_transaccion) ? 'primary' : 'warning'}
            disableElevation
            sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 700, 
                minWidth: 100,
                boxShadow: theme.shadows[2]
            }}
          >
            {isThisLoading ? '...' : 
             ['pendiente', 'en_proceso'].includes(row.estado_transaccion) ? 'Pagar' : 'Reintentar'}
          </Button>
        );
      }
    }
  ], [retryMutation, highlightedId, theme]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Historial de Transacciones" 
        subtitle="Monitorea tus pagos, inversiones y estados de cuenta." 
      />

      {/* --- KPI SUMMARY --- */}
      <Box 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} 
        gap={3} 
        mb={4}
      >
        <StatCard 
            title="Total Operado" 
            value={formatCurrency(stats.totalAmount)} 
            subtitle="En transacciones exitosas" 
            icon={<MonetizationOn />} 
            color="primary" 
            loading={isLoading}
        />
        <StatCard 
            title="Operaciones" 
            value={counts.exitosas.toString()} 
            subtitle="Transacciones completadas" 
            icon={<SwapHoriz />} 
            color="secondary" 
            loading={isLoading}
        />
        <StatCard 
            title={counts.problemas > 0 ? "Atención" : "Estado"} 
            value={counts.problemas > 0 ? counts.problemas.toString() : "OK"} 
            subtitle={counts.problemas > 0 ? "Requieren revisión" : "Sin errores pendientes"} 
            icon={counts.problemas > 0 ? <Warning /> : <CheckCircle />} 
            color={counts.problemas > 0 ? "error" : "success"} 
            loading={isLoading}
        />
      </Box>

      {/* --- FILTROS Y PESTAÑAS --- */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        alignItems={{ xs: 'stretch', md: 'center' }} 
        justifyContent="space-between"
        mb={3}
      >
        {/* TABS */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
                value={currentTab} 
                onChange={(_, val) => setCurrentTab(val)} 
                textColor="primary" 
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab label={`Todas (${counts.todas})`} />
                <Tab label="Exitosas" icon={<CheckCircle fontSize="small"/>} iconPosition="start" />
                <Tab 
                    label={
                        <Badge badgeContent={counts.problemas} color="error" sx={{ px: 1 }}>
                            Pendientes / Fallidas
                        </Badge>
                    } 
                    icon={<ErrorOutline fontSize="small" />}
                    iconPosition="start"
                    sx={{ 
                        color: counts.problemas > 0 ? 'error.main' : 'inherit',
                        fontWeight: counts.problemas > 0 ? 'bold' : 'normal'
                    }}
                />
            </Tabs>
        </Box>

        {/* BUSCADOR */}
        <TextField
            placeholder="Buscar..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search fontSize="small" color="action" />
                    </InputAdornment>
                ),
            }}
            sx={{ 
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: 2
                }
            }}
        />
      </Stack>

      {/* --- TABLA --- */}
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
            <DataTable 
                columns={columns} 
                data={filteredData} 
                getRowKey={(row) => row.id}
                pagination={true}
                defaultRowsPerPage={10}
                highlightedRowId={highlightedId}
                isRowActive={(row) => row.estado_transaccion !== 'reembolsado'}
                emptyMessage={
                    searchTerm ? "No se encontraron resultados para tu búsqueda." :
                    currentTab === 1 ? "No tienes transacciones completadas aún." :
                    currentTab === 2 ? "¡Todo en orden! No hay transacciones fallidas o pendientes." :
                    "No hay movimientos registrados."
                }
                getRowSx={(row) => ({
                    bgcolor: ['fallido', 'expirado', 'rechazado_por_capacidad'].includes(row.estado_transaccion) 
                        ? alpha(theme.palette.error.main, 0.05) 
                        : ['pendiente', 'en_proceso'].includes(row.estado_transaccion)
                        ? alpha(theme.palette.warning.main, 0.02)
                        : 'inherit',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }
                })}
            />
        </Paper>
      </QueryHandler>
    </PageContainer>
  );
};

export default MisTransacciones;