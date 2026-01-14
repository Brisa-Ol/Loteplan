// src/pages/client/MiCuenta/Pagos/MisPagos.tsx

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CheckCircle, ErrorOutline, Lock, ReceiptLong,
  Schedule, Warning, AccountBalanceWallet
} from '@mui/icons-material';
import {
  alpha, Badge, Box, Button, Chip, Stack,
  Tab, Tabs, Typography, useTheme
} from '@mui/material';

// --- SERVICIOS Y TIPOS ---
import type { ApiError } from '../../../../services/httpService';
import PagoService from '../../../../services/pago.service';
import MercadoPagoService from '../../../../services/pagoMercado.service';
import SuscripcionService from '../../../../services/suscripcion.service';
import type { PagoDto } from '../../../../types/dto/pago.dto';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';

// --- COMPONENTES ---
import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../../shared/components/domain/cards/StatCard/StatCard';
import TwoFactorAuthModal from '../../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import { useModal } from '../../../../../shared/hooks/useModal';
import { HistorialPagosAgrupado } from './HistorialAgrupado';

// --- CONTEXTO ---
import { env } from '../../../../config/env';

// Helper de Estados (Fuera del componente para evitar recreación)
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pagado': return { color: 'success' as const, label: 'Pagado', icon: <CheckCircle /> };
    case 'pendiente': return { color: 'info' as const, label: 'Próximo', icon: <Schedule /> };
    case 'vencido': return { color: 'error' as const, label: 'Vencido', icon: <ErrorOutline /> };
    case 'cubierto_por_puja': return { color: 'success' as const, label: 'Cubierto (Puja)', icon: <AccountBalanceWallet /> };
    default: return { color: 'default' as const, label: status, icon: <Warning /> };
  }
};

const MisPagos: React.FC = () => {
  const theme = useTheme();
  
  // Hooks
  const twoFaModal = useModal();
  
  // Estados
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0); 

  // Queries
  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: async () => (await PagoService.getMyPayments()).data,
    refetchOnWindowFocus: false
  });

  const suscripcionesQuery = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    staleTime: 1000 * 60 * 5 
  });

  const isLoading = pagosQuery.isLoading || suscripcionesQuery.isLoading;
  const error = pagosQuery.error || suscripcionesQuery.error;

  // Mapa de Proyectos (Optimización para evitar .find en cada fila)
  const proyectosMap = useMemo(() => {
    const map = new Map<number, string>();
    suscripcionesQuery.data?.forEach(s => {
      if (s.id_proyecto && s.proyectoAsociado) {
        map.set(s.id_proyecto, s.proyectoAsociado.nombre_proyecto);
      }
    });
    return map;
  }, [suscripcionesQuery.data]);

  const getNombreProyecto = (idProyecto: number) => proyectosMap.get(idProyecto) || `Proyecto #${idProyecto}`;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

  // Filtrado y Stats
  const { filteredData, counts, historialData, stats } = useMemo(() => {
    const data = pagosQuery.data || [];
    
    const counts = {
      pendientes: data.filter(p => p.estado_pago === 'pendiente').length,
      vencidas: data.filter(p => p.estado_pago === 'vencido').length,
      pagadas: data.filter(p => p.estado_pago === 'pagado' || p.estado_pago === 'cubierto_por_puja').length
    };

    const stats = {
        deudaVencida: data.filter(p => p.estado_pago === 'vencido').reduce((acc, curr) => acc + Number(curr.monto), 0),
        proximosVencimientos: data.filter(p => p.estado_pago === 'pendiente').reduce((acc, curr) => acc + Number(curr.monto), 0)
    };

    const sorted = [...data].sort((a, b) => 
      new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()
    );

    let filtered: PagoDto[] = [];
    if (currentTab === 0) filtered = sorted.filter(p => p.estado_pago === 'pendiente');
    if (currentTab === 1) filtered = sorted.filter(p => p.estado_pago === 'vencido');

    const historialData = sorted.filter(p => 
        p.estado_pago === 'pagado' || p.estado_pago === 'cubierto_por_puja'
    );

    return { filteredData: filtered, counts, historialData, stats };
  }, [pagosQuery.data, currentTab]);

  // Mutaciones
  const iniciarPagoMutation = useMutation({
    mutationFn: async (pagoId: number) => {
      setSelectedPagoId(pagoId);
      return await MercadoPagoService.iniciarCheckoutModelo('pago', pagoId);
    },
    onSuccess: (response) => {
      const data = response.data;
      if (response.status === 202 || data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: () => {
      setSelectedPagoId(null);
    }
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedPagoId) throw new Error("ID de pago perdido.");
      return await PagoService.confirmarPago2FA({ pagoId: selectedPagoId, codigo_2fa: codigo });
    },
    onSuccess: (response) => {
      if (response.data.redirectUrl) window.location.href = response.data.redirectUrl;
      twoFaModal.close();
    },
    onError: (err: unknown) => {
        const apiError = err as ApiError;
        setTwoFAError(apiError.message || "Código inválido.");
    }
  });

  // Columnas
  const columns: DataTableColumn<PagoDto>[] = useMemo(() => [
    {
      id: 'proyecto', label: 'Proyecto', minWidth: 180,
      render: (row) => (
        <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight="bold" color="text.primary">
            {getNombreProyecto(row.id_proyecto ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
             ID Suscripción: #{row.id_suscripcion}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'mes', label: 'Cuota', minWidth: 100, align: 'center',
      render: (row) => (
        <Chip 
            label={`Cuota ${row.mes}`} size="small" variant="outlined" 
            sx={{ fontWeight: 600, borderColor: theme.palette.divider }}
        />
      )
    },
    {
      id: 'fecha_vencimiento', label: 'Vencimiento', minWidth: 120,
      render: (row) => (
          <Typography variant="body2">
              {new Date(row.fecha_vencimiento).toLocaleDateString(env.defaultLocale)}
          </Typography>
      )
    },
    {
      id: 'monto', label: 'Monto', minWidth: 140,
      render: (row) => (
        <Typography variant="subtitle2" color="primary.main" fontWeight={800}>
          {formatCurrency(Number(row.monto))}
        </Typography>
      )
    },
    {
      id: 'estado_pago', label: 'Estado', minWidth: 140,
      render: (row) => {
        const config = getStatusConfig(row.estado_pago);
        return (
          <Chip 
            label={config.label} 
            color={config.color} 
            size="small" variant="filled" 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            icon={config.icon as any}
            sx={{ fontWeight: 600 }}
          />
        );
      }
    },
    {
      id: 'acciones', label: 'Acción', align: 'right',
      render: (row) => {
        const isProcessing = iniciarPagoMutation.isPending && selectedPagoId === row.id;
        return (
          <Button
            variant="contained"
            color={row.estado_pago === 'vencido' ? 'error' : 'primary'}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              iniciarPagoMutation.mutate(row.id);
            }}
            disabled={iniciarPagoMutation.isPending}
            startIcon={!isProcessing ? <Lock fontSize="small" /> : null}
            disableElevation
            sx={{ borderRadius: 2, minWidth: 120, fontWeight: 700, boxShadow: theme.shadows[2] }}
          >
            {isProcessing ? '...' : row.estado_pago === 'vencido' ? 'Regularizar' : 'Pagar'}
          </Button>
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [proyectosMap, iniciarPagoMutation.isPending, selectedPagoId, theme]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Cuotas" subtitle="Gestiona tus obligaciones mensuales y visualiza el progreso de tus planes." />

      {/* KPI SUMMARY */}
      <Box 
        mb={4} 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} 
        gap={3}
      >
         <StatCard 
            title="Próximos a Vencer" 
            value={formatCurrency(stats.proximosVencimientos)} 
            subtitle={`${counts.pendientes} cuotas pendientes`} 
            icon={<Schedule />} 
            color="info" 
            loading={isLoading}
        />
        <StatCard 
            title="Deuda Vencida" 
            value={formatCurrency(stats.deudaVencida)} 
            subtitle={`${counts.vencidas} cuotas vencidas`} 
            icon={<Warning />} 
            color="error" 
            loading={isLoading}
        />
      </Box>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} indicatorColor="primary" textColor="primary" variant="scrollable" scrollButtons="auto">
          <Tab icon={<Schedule />} iconPosition="start" label={<Badge badgeContent={counts.pendientes} color="info" sx={{ px: 1 }}>Por Pagar</Badge>} />
          <Tab icon={<ErrorOutline />} iconPosition="start" label={<Badge badgeContent={counts.vencidas} color="error" sx={{ px: 1 }}>Vencidas</Badge>} sx={{ color: counts.vencidas > 0 ? 'error.main' : 'inherit', fontWeight: counts.vencidas > 0 ? 'bold' : 'normal' }} />
          <Tab icon={<ReceiptLong />} iconPosition="start" label={`Historial (${counts.pagadas})`} />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Box>
            {currentTab === 2 ? (
                <HistorialPagosAgrupado pagos={historialData} suscripciones={suscripcionesQuery.data || []} />
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredData}
                    getRowKey={(row) => row.id}
                    pagination={true}
                    defaultRowsPerPage={10}
                    emptyMessage={currentTab === 0 ? "¡Todo al día! No tienes pagos pendientes." : "¡Excelente! No tienes cuotas vencidas."}
                    getRowSx={(row) => ({
                        bgcolor: row.estado_pago === 'vencido' ? alpha(theme.palette.error.main, 0.05) : 'inherit',
                        transition: 'background-color 0.3s',
                        '&:hover': {
                            bgcolor: row.estado_pago === 'vencido' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.action.hover, 0.05)
                        }
                    })}
                />
            )}
        </Box>
      </QueryHandler>

      {/* MODAL 2FA */}
      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setSelectedPagoId(null); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError}
        title="Confirmar Pago Seguro"
        description="Por seguridad, ingresa el código de tu autenticador para procesar este pago."
      />
    </PageContainer>
  );
};

export default MisPagos;