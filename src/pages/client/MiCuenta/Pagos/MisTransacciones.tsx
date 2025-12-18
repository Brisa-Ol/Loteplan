import React, { useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Stack, Chip, Button, IconButton, Tooltip 
} from '@mui/material';
import { 
  TrendingUp, EventRepeat, Gavel, CheckCircle, 
  ErrorOutline, HourglassEmpty, Refresh, ReceiptLong, Info
} from '@mui/icons-material';

// Servicios y Tipos
import type { TransaccionDto } from '../../../../types/dto/transaccion.dto';
import TransaccionService from '../../../../Services/transaccion.service';
import MercadoPagoService from '../../../../Services/pagoMercado.service';

// Componentes Comunes
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../components/common/DataTable/DataTable'; // 👈 Usamos DataTable

const MisTransacciones: React.FC = () => {
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['misTransacciones'],
    queryFn: async () => (await TransaccionService.getMyTransactions()).data
  });

  // Mutación para REINTENTAR el pago
  const retryMutation = useMutation({
    mutationFn: async (idTransaccion: number) => {
      return await MercadoPagoService.createCheckoutGenerico({ id_transaccion: idTransaccion });
    },
    onSuccess: (res) => {
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
    },
    onError: (err: any) => alert(err.response?.data?.error || "Error al regenerar checkout.")
  });

  // Helpers de visualización (Iconos y colores)
  const getTypeConfig = (tipo: string) => {
    switch (tipo) {
      case 'directo': return { icon: <TrendingUp fontSize="small" />, color: 'info' as const, label: 'Inversión' };
      case 'mensual': return { icon: <EventRepeat fontSize="small" />, color: 'secondary' as const, label: 'Cuota' };
      case 'pago_suscripcion_inicial': return { icon: <EventRepeat fontSize="small" />, color: 'primary' as const, label: 'Suscripción' };
      case 'Puja': return { icon: <Gavel fontSize="small" />, color: 'warning' as const, label: 'Subasta' };
      default: return { icon: <ReceiptLong fontSize="small" />, color: 'default' as const, label: 'Operación' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pagado': return { color: 'success' as const, label: 'Pagado', icon: <CheckCircle fontSize="small"/> };
      case 'pendiente': 
      case 'en_proceso': return { color: 'warning' as const, label: 'Pendiente', icon: <HourglassEmpty fontSize="small"/> };
      case 'fallido': 
      case 'rechazado_por_capacidad': 
      case 'rechazado_proyecto_cerrado': return { color: 'error' as const, label: 'Fallido', icon: <ErrorOutline fontSize="small"/> };
      case 'reembolsado': return { color: 'info' as const, label: 'Reembolsado', icon: <Refresh fontSize="small"/> };
      default: return { color: 'default' as const, label: status, icon: <Info fontSize="small" /> };
    }
  };

  // Definición de Columnas
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    { 
      id: 'fecha', label: 'Fecha', minWidth: 150,
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
      id: 'descripcion', label: 'Descripción', minWidth: 250,
      render: (row) => {
        const proyecto = row.proyectoTransaccion?.nombre_proyecto || 'Proyecto no disponible';
        let detalle = '';
        if (row.tipo_transaccion === 'mensual' && row.pagoMensual) detalle = `Cuota #${row.pagoMensual.mes}`;
        else if (row.tipo_transaccion === 'pago_suscripcion_inicial') detalle = 'Suscripción Inicial';
        else if (row.tipo_transaccion === 'directo') detalle = 'Inversión Directa';
        else if (row.tipo_transaccion === 'Puja') detalle = 'Pago de Subasta';

        const conf = getTypeConfig(row.tipo_transaccion);

        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>{proyecto}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Chip icon={conf.icon} label={detalle} size="small" variant="outlined" color={conf.color} sx={{ height: 20, fontSize: '0.7rem' }} />
                {row.pagoPasarela && (
                    <Tooltip title={`ID MP: ${row.pagoPasarela.id_transaccion_pasarela}`}>
                        <Chip label="MP" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#009ee3', color: 'white' }} />
                    </Tooltip>
                )}
            </Stack>
          </Box>
        );
      }
    },
    { 
      id: 'monto', label: 'Monto', align: 'right',
      render: (row) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
           ${Number(row.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    { 
      id: 'estado', label: 'Estado', align: 'center',
      render: (row) => {
        const conf = getStatusConfig(row.estado_transaccion);
        return (
            <Tooltip title={row.error_detalle || ''}>
                <Chip label={conf.label} color={conf.color} icon={conf.icon} size="small" />
            </Tooltip>
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (row) => {
        const canRetry = ['pendiente', 'fallido', 'expirado', 'en_proceso'].includes(row.estado_transaccion);
        if (!canRetry) return null;

        return (
          <Button 
            variant="contained" 
            size="small" 
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate(row.id)}
            startIcon={<Refresh />}
            color={row.estado_transaccion === 'pendiente' ? 'primary' : 'warning'}
          >
            {row.estado_transaccion === 'pendiente' ? 'Pagar' : 'Reintentar'}
          </Button>
        );
      }
    }
  ], []);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Historial de Transacciones" subtitle="Registro detallado de tus movimientos financieros." />

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable 
            columns={columns} 
            data={transacciones} 
            getRowKey={(row) => row.id}
            pagination={true}
            defaultRowsPerPage={10}
            emptyMessage="No tienes movimientos registrados."
            getRowSx={(row) => ({
                borderLeft: row.estado_transaccion === 'fallido' ? '4px solid #d32f2f' : undefined
            })}
        />
      </QueryHandler>
    </PageContainer>
  );
};

export default MisTransacciones;