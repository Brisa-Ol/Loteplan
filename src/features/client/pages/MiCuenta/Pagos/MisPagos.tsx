// src/features/client/pages/Pagos/MisPagos.tsx

import {
  CheckCircle,
  Lock,
  PriorityHigh,
  ReceiptLong,
  RocketLaunch,
  Schedule,
  Stars,
  Warning
} from '@mui/icons-material';
import {
  Alert, AlertTitle,
  alpha, Badge, Box, Button, Chip,
  Paper,
  Tab, Tabs, Typography, useTheme
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';

// Componentes
import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../../shared/components/domain/cards/StatCard/StatCard';
import TwoFactorAuthModal from '../../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../../shared/components/layout/headers/PageHeader';
import { useModal } from '../../../../../shared/hooks/useModal';
import { HistorialPagosAgrupado } from './HistorialAgrupado';

// Servicios y Utils
import PagoService from '@/core/api/services/pago.service';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';

// Tipos
import type { ApiError } from '@/core/api/httpService';
import { env } from '@/core/config/env';
import type { PagoDto } from '@/core/types/dto/pago.dto';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';

// =====================================================
// UTILS
// =====================================================

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pendiente':
      return { label: 'PENDIENTE', color: 'info' as const, icon: <Schedule fontSize="small" /> };
    case 'pagado':
      return { label: 'PAGADO', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
    case 'vencido':
      return { label: 'VENCIDO', color: 'error' as const, icon: <PriorityHigh fontSize="small" /> };
    case 'cubierto_por_puja':
      return { label: 'CUBIERTO (PUJA)', color: 'secondary' as const, icon: <Stars fontSize="small" /> };
    case 'cancelado':
      return { label: 'CANCELADO', color: 'default' as const, icon: <Warning fontSize="small" /> };
    default:
      return { label: status.toUpperCase(), color: 'default' as const, icon: undefined };
  }
};

// =====================================================
// COMPONENTES DE CELDA (MEMOIZADOS)
// =====================================================

const ProjectCell = React.memo<{ nombre: string; idSuscripcion: number }>(({ nombre, idSuscripcion }) => {
  const theme = useTheme();
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700}>{nombre}</Typography>
      <Chip label={`SUSC: #${idSuscripcion}`} size="small"
        sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'monospace', mt: 0.5, bgcolor: alpha(theme.palette.secondary.main, 0.1) }}
      />
    </Box>
  );
});

ProjectCell.displayName = 'ProjectCell';

const ActionButton = React.memo<{
  pagoId: number; estadoPago: string; isProcessing: boolean; isThisProcessing: boolean; onPay: (id: number) => void;
}>(({ pagoId, estadoPago, isProcessing, isThisProcessing, onPay }) => (
  <Button
    variant="contained"
    color={estadoPago === 'vencido' ? 'error' : 'primary'}
    size="small"
    onClick={(e) => { e.stopPropagation(); onPay(pagoId); }}
    disabled={isProcessing}
    startIcon={!isThisProcessing && <Lock fontSize="small" />}
    sx={{ borderRadius: 2, minWidth: 110, fontWeight: 700, textTransform: 'none' }}
  >
    {isThisProcessing ? '...' : estadoPago === 'vencido' ? 'Regularizar' : 'Pagar'}
  </Button>
));

ActionButton.displayName = 'ActionButton';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const MisPagos: React.FC = () => {
  const theme = useTheme();
  const twoFaModal = useModal();
  const formatCurrency = useCurrencyFormatter();

  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // 1. DATA QUERIES
  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: async () => (await PagoService.getMyPayments()).data,
  });

  const suscripcionesQuery = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
  });

  const isLoading = pagosQuery.isLoading || suscripcionesQuery.isLoading;

  // 2. MAPPING & LOGIC (MEMOIZED)
  const proyectosMap = useMemo(() => {
    const map = new Map<number, string>();
    suscripcionesQuery.data?.forEach(s => {
      if (s.id_proyecto && s.proyectoAsociado) map.set(s.id_proyecto, s.proyectoAsociado.nombre_proyecto);
    });
    return map;
  }, [suscripcionesQuery.data]);

  const { filteredData, counts, historialData, stats } = useMemo(() => {
    const data = pagosQuery.data || [];
    const counts = { pendientes: 0, vencidas: 0, pagadas: 0 };
    const stats = { deudaVencida: 0, proximosVencimientos: 0, totalAbonado: 0 };

    data.forEach(p => {
      const monto = Number(p.monto);
      if (p.estado_pago === 'pendiente') {
        counts.pendientes++;
        stats.proximosVencimientos += monto;
      } else if (p.estado_pago === 'vencido') {
        counts.vencidas++;
        stats.deudaVencida += monto;
      } else if (['pagado', 'cubierto_por_puja'].includes(p.estado_pago)) {
        counts.pagadas++;
        stats.totalAbonado += monto;
      }
    });

    const sorted = [...data].sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());

    return {
      filteredData: currentTab === 0 ? sorted.filter(p => p.estado_pago === 'pendiente') : sorted.filter(p => p.estado_pago === 'vencido'),
      counts,
      historialData: sorted.filter(p => ['pagado', 'cubierto_por_puja'].includes(p.estado_pago)),
      stats
    };
  }, [pagosQuery.data, currentTab]);

  // 3. MUTATIONS (PAGO Y 2FA)
  const iniciarPagoMutation = useMutation({
    mutationFn: (pagoId: number) => {
      setSelectedPagoId(pagoId);
      return MercadoPagoService.iniciarCheckoutModelo('pago', pagoId);
    },
    onSuccess: (res) => {
      if (res.status === 202 || res.data.is2FARequired) { setTwoFAError(null); twoFaModal.open(); return; }
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
    },
    onError: () => setSelectedPagoId(null)
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

  const handlePay = useCallback((id: number) => iniciarPagoMutation.mutate(id), [iniciarPagoMutation]);

  // 4. COLUMNS CONFIG
  const columns = useMemo<DataTableColumn<PagoDto>[]>(() => [
    {
      id: 'proyecto', label: 'Proyecto / Referencia', minWidth: 220,
      render: (row) => <ProjectCell nombre={proyectosMap.get(row.id_proyecto ?? 0) || `Proyecto #${row.id_proyecto}`} idSuscripcion={row.id_suscripcion} />
    },
    {
      id: 'mes', label: 'Cuota', minWidth: 100,
      render: (row) => <Chip label={`Cuota ${row.mes}`} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1 }} />
    },
    {
      id: 'fecha_vencimiento', label: 'Vencimiento', minWidth: 120,
      render: (row) => <Typography variant="body2">{new Date(row.fecha_vencimiento).toLocaleDateString(env.defaultLocale)}</Typography>
    },
    {
      id: 'monto', label: 'Importe', minWidth: 140,
      render: (row) => <Typography variant="body2" fontWeight={800}>{formatCurrency(row.monto)}</Typography>
    },
    {
      id: 'estado_pago', label: 'Estado', minWidth: 140,
      // ✅ CORREGIDO: Se restauró la función render
      render: (row) => {
        const { label, color, icon } = getStatusConfig(row.estado_pago);
        return (
          <Chip label={label} color={color} size="small" icon={icon}
            variant={row.estado_pago === 'vencido' ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }}
          />
        );
      }
    },
    {
      id: 'acciones', label: 'Acción', align: 'right',
      render: (row) => (
        <ActionButton pagoId={row.id} estadoPago={row.estado_pago} isProcessing={iniciarPagoMutation.isPending}
          isThisProcessing={iniciarPagoMutation.isPending && selectedPagoId === row.id} onPay={handlePay}
        />
      )
    }
  ], [proyectosMap, formatCurrency, iniciarPagoMutation.isPending, selectedPagoId, handlePay]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Pagos" subtitle="Control de cuotas y registro de transacciones." />

      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard title="Próximos a Vencer" value={formatCurrency(stats.proximosVencimientos)} subtitle={`${counts.pendientes} cuotas`} icon={<Schedule />} color="info" loading={isLoading} />
        <StatCard title="Deuda Vencida" value={formatCurrency(stats.deudaVencida)} subtitle={`${counts.vencidas} cuotas`} icon={<Warning />} color="error" loading={isLoading} />
        <StatCard title="Total Abonado" value={formatCurrency(stats.totalAbonado)} icon={<RocketLaunch />} color="success" loading={isLoading} />
      </Box>

      <Box mb={4}>
        {!isLoading && counts.vencidas > 0 ? (
          <Alert severity="error" variant="filled" icon={<PriorityHigh fontSize="large" />} sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <AlertTitle sx={{ fontWeight: 800 }}>¡Atención!</AlertTitle>
            Tienes <strong>{counts.vencidas} cuotas vencidas</strong> bloqueando tu participación en subastas.
          </Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Stars sx={{ fontSize: 80, opacity: 0.1, position: 'absolute', right: -10, bottom: -20 }} />
            <Typography variant="h6" fontWeight={800}>¡Cuentas claras, lotes asegurados!</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Estás al día con tus pagos. Tienes acceso total a las subastas.</Typography>
          </Paper>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} indicatorColor="primary" textColor="primary">
          <Tab icon={<Schedule />} iconPosition="start" label={<Badge badgeContent={counts.pendientes} color="info" sx={{ px: 1 }}>Por Pagar</Badge>} />
          <Tab icon={<Warning />} iconPosition="start" label={<Badge badgeContent={counts.vencidas} color="error" sx={{ px: 1 }}>Vencidas</Badge>} />
          <Tab icon={<ReceiptLong />} iconPosition="start" label="Historial" />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={pagosQuery.error as Error | null}>
        <Box>
          {currentTab === 2 ? (
            <HistorialPagosAgrupado pagos={historialData} suscripciones={suscripcionesQuery.data || []} />
          ) : (
            <DataTable columns={columns} data={filteredData} getRowKey={(row) => row.id} pagination />
          )}
        </Box>
      </QueryHandler>

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