import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Stack, Chip, Button, Tooltip, 
  Tabs, Tab, Badge, TextField, InputAdornment 
} from '@mui/material';
import { 
  TrendingUp, EventRepeat, Gavel, CheckCircle, 
  ErrorOutline, HourglassEmpty, Refresh, ReceiptLong, Info,
  Search, FilterList
} from '@mui/icons-material';

// Servicios y Tipos
import type { TransaccionDto } from '../../../../types/dto/transaccion.dto';
import TransaccionService from '../../../../Services/transaccion.service';
import MercadoPagoService from '../../../../Services/pagoMercado.service';

// Componentes Comunes
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../components/common/DataTable/DataTable';


const MisTransacciones: React.FC = () => {
  // 1. Estados de Filtros
  const [currentTab, setCurrentTab] = useState(0); // 0: Todas, 1: Exitosas, 2: Pendientes/Fallidas
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Carga de Datos
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['misTransacciones'],
    queryFn: async () => (await TransaccionService.getMyTransactions()).data
  });

  // 3. Mutación Retry
  const retryMutation = useMutation({
    mutationFn: async (idTransaccion: number) => {
      return await MercadoPagoService.createCheckoutGenerico({ id_transaccion: idTransaccion });
    },
    onSuccess: (res) => {
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
    },
    onError: (err: any) => alert(err.response?.data?.error || "Error al regenerar checkout.")
  });

  // 4. Lógica de Filtrado y Contadores
  const { filteredData, counts } = useMemo(() => {
    // A. Filtrado por Texto (Buscador)
    let data = transacciones;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.proyectoTransaccion?.nombre_proyecto?.toLowerCase().includes(lowerTerm) ||
        t.monto.toString().includes(lowerTerm) || 
        t.id.toString().includes(lowerTerm)
      );
    }

    // B. Contadores (sobre la data filtrada por texto o sobre la total, depende tu preferencia)
    // Usualmente los contadores de tabs se calculan sobre el total sin búsqueda
    const totalCounts = {
      todas: transacciones.length,
      exitosas: transacciones.filter(t => t.estado_transaccion === 'pagado').length,
      problemas: transacciones.filter(t => ['pendiente', 'fallido', 'expirado', 'rechazado_por_capacidad'].includes(t.estado_transaccion)).length
    };

    // C. Filtrado por Tab
    if (currentTab === 1) { // Exitosas
      data = data.filter(t => t.estado_transaccion === 'pagado');
    } else if (currentTab === 2) { // Problemas / Pendientes
      data = data.filter(t => ['pendiente', 'fallido', 'expirado', 'rechazado_por_capacidad', 'en_proceso'].includes(t.estado_transaccion));
    }

    // D. Ordenamiento (Más reciente primero)
    data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    return { filteredData: data, counts: totalCounts };
  }, [transacciones, currentTab, searchTerm]);

  // --- CONFIGURACIÓN VISUAL (Helpers) ---
  const getTypeConfig = (tipo: string) => {
    switch (tipo) {
      case 'directo': return { icon: <TrendingUp fontSize="small" />, color: 'info' as const, label: 'Inversión' };
      case 'mensual': return { icon: <EventRepeat fontSize="small" />, color: 'secondary' as const, label: 'Cuota' };
      case 'pago_suscripcion_inicial': return { icon: <ReceiptLong fontSize="small" />, color: 'primary' as const, label: 'Suscripción' };
      case 'Puja': return { icon: <Gavel fontSize="small" />, color: 'warning' as const, label: 'Subasta' };
      default: return { icon: <Info fontSize="small" />, color: 'default' as const, label: 'Operación' };
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

  // --- COLUMNAS DE LA TABLA ---
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    { 
      id: 'fecha', label: 'Fecha', minWidth: 120,
      render: (row) => {
        const date = new Date(row.fecha_transaccion ?? row.createdAt);
        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>{date.toLocaleDateString()}</Typography>
            <Typography variant="caption" color="text.secondary">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Typography>
          </Box>
        );
      }
    },
    { 
      id: 'descripcion', label: 'Detalle', minWidth: 200,
      render: (row) => {
        const proyecto = row.proyectoTransaccion?.nombre_proyecto || 'Sin Proyecto';
        let detalle = '';
        if (row.tipo_transaccion === 'mensual' && row.pagoMensual) detalle = `Cuota #${row.pagoMensual.mes}`;
        else if (row.tipo_transaccion === 'pago_suscripcion_inicial') detalle = 'Suscripción Inicial';
        else if (row.tipo_transaccion === 'directo') detalle = 'Inversión Directa';
        else if (row.tipo_transaccion === 'Puja') detalle = 'Pago de Subasta';

        const conf = getTypeConfig(row.tipo_transaccion);

        return (
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>{proyecto}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Chip 
                    label={detalle || conf.label} 
                    size="small" 
                    variant="outlined" 
                    color={conf.color} 
                    icon={conf.icon}
                    sx={{ height: 20, fontSize: '0.7rem', border: 'none', bgcolor: 'action.hover' }} 
                />
            </Stack>
          </Box>
        );
      }
    },
    { 
      id: 'monto', label: 'Monto', align: 'right', minWidth: 100,
      render: (row) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
           ${Number(row.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    { 
      id: 'estado', label: 'Estado', align: 'center', minWidth: 110,
      render: (row) => {
        const conf = getStatusConfig(row.estado_transaccion);
        return (
            <Tooltip title={row.error_detalle || ''} arrow>
                <Chip 
                    label={conf.label} 
                    color={conf.color} 
                    size="small" 
                    variant="filled" // O 'filled'
                    icon={conf.icon as any}
                />
            </Tooltip>
        );
      }
    },
    {
      id: 'acciones', label: 'Acción', align: 'right', minWidth: 100,
      render: (row) => {
        // Solo permitimos reintentar si no está pagado ni reembolsado
        const canRetry = ['pendiente', 'fallido', 'expirado', 'en_proceso', 'rechazado_por_capacidad'].includes(row.estado_transaccion);
        
        if (!canRetry) return <Box minWidth={85} />; // Espaciador para alinear

        return (
          <Button 
            variant="contained" 
            size="small" 
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate(row.id)}
            color={['pendiente', 'en_proceso'].includes(row.estado_transaccion) ? 'primary' : 'warning'}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem', minWidth: 85 }}
          >
            {retryMutation.isPending ? '...' : 
             ['pendiente', 'en_proceso'].includes(row.estado_transaccion) ? 'Pagar' : 'Reintentar'}
          </Button>
        );
      }
    }
  ], [retryMutation.isPending]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Historial de Transacciones" 
        subtitle="Monitorea tus pagos, inversiones y estados de cuenta." 
      />

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
            <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} textColor="primary" indicatorColor="primary">
                <Tab label={`Todas (${counts.todas})`} />
                <Tab label="Exitosas" icon={<CheckCircle fontSize="small"/>} iconPosition="start" />
                <Tab 
                    label={
                        <Badge badgeContent={counts.problemas} color="error" sx={{ px: 1 }}>
                            Pendientes / Fallidas
                        </Badge>
                    } 
                    // Si hay problemas, el texto se pone un poco rojo para alertar
                    sx={{ color: counts.problemas > 0 ? 'error.main' : 'inherit' }}
                />
            </Tabs>
        </Box>

        {/* BUSCADOR */}
        <TextField
            placeholder="Buscar proyecto o monto..."
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
            sx={{ minWidth: 250 }}
        />
      </Stack>

      {/* --- TABLA --- */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable 
            columns={columns} 
            data={filteredData} 
            getRowKey={(row) => row.id}
            pagination={true}
            defaultRowsPerPage={10}
            emptyMessage={
                searchTerm ? "No se encontraron resultados para tu búsqueda." :
                currentTab === 1 ? "No tienes transacciones completadas aún." :
                currentTab === 2 ? "¡Todo en orden! No hay transacciones fallidas o pendientes." :
                "No hay movimientos registrados."
            }
            // Resaltamos filas con problemas
            getRowSx={(row) => ({
                bgcolor: ['fallido', 'expirado', 'rechazado_por_capacidad'].includes(row.estado_transaccion) ? '#fff5f5' : 'inherit',
                opacity: row.estado_transaccion === 'reembolsado' ? 0.7 : 1
            })}
        />
      </QueryHandler>
    </PageContainer>
  );
};

export default MisTransacciones;