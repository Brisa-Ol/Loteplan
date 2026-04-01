// src/features/client/pages/Pagos/MisPagos.tsx

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { ConfirmDialog, DataTable, PageContainer, PageHeader, QueryHandler, StatCard, useConfirmDialog, useModal, type DataTableColumn } from '@/shared';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import {
  CheckCircle, Lock, PriorityHigh, ReceiptLong, RocketLaunch,
  Schedule, Stars, Warning
} from '@mui/icons-material';
import {
  Badge, Box, Button, Chip, Stack,
  Tab, Tabs, Tooltip, Typography, useTheme
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { HistorialPagosAgrupado } from './HistorialAgrupado/HistorialAgrupado';


const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pendiente': return { label: 'PENDIENTE', color: 'info' as const, icon: <Schedule fontSize="small" /> };
    case 'pagado': return { label: 'PAGADO', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
    case 'vencido': return { label: 'VENCIDO', color: 'error' as const, icon: <PriorityHigh fontSize="small" /> };
    case 'cubierto_por_puja': return { label: 'CUBIERTO', color: 'secondary' as const, icon: <Stars fontSize="small" /> };
    case 'cancelado': return { label: 'CANCELADO', color: 'default' as const, icon: <Warning fontSize="small" /> };
    default: return { label: status.toUpperCase(), color: 'default' as const, icon: undefined };
  }
};

const ProjectCell = React.memo<{
  nombre: string;
  cuotaActual: number;
  totalCuotas?: number;
  cuotasRestantes?: number
}>(({ nombre, cuotaActual, totalCuotas, cuotasRestantes }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
      {nombre}
    </Typography>
    <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
      <Typography variant="caption" color="text.secondary">
        Cuota {cuotaActual} {totalCuotas ? `de ${totalCuotas}` : ''}
      </Typography>
      {cuotasRestantes !== undefined && cuotasRestantes > 0 && (
        <Chip
          label={`${cuotasRestantes} rest.`}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'action.hover', fontWeight: 700, border: 'none' }}
        />
      )}
    </Stack>
  </Box>
));

const MisPagos: React.FC = () => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const twoFaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: PagoService.getMyPayments,
  });
  console.log(pagosQuery.data);
  
  const isLoading = pagosQuery.isLoading;

  const { filteredData, counts, historialData, stats } = useMemo(() => {
    const data = pagosQuery.data || [];
    const counts = { pendientes: 0, vencidas: 0, pagadas: 0 };
    const stats = { deudaVencida: 0, proximosVencimientos: 0, totalAbonado: 0 };

    data.forEach(p => {
      const monto = Number(p.monto || 0);
      if (p.estado_pago === 'pendiente') { counts.pendientes++; stats.proximosVencimientos += monto; }
      else if (p.estado_pago === 'vencido') { counts.vencidas++; stats.deudaVencida += monto; }
      else if (['pagado', 'cubierto_por_puja'].includes(p.estado_pago)) { counts.pagadas++; stats.totalAbonado += monto; }
    });

    const sorted = [...data].sort((a, b) => b.mes - a.mes);
    return {
      filteredData: currentTab === 0 ? sorted.filter(p => p.estado_pago === 'pendiente') : sorted.filter(p => p.estado_pago === 'vencido'),
      counts,
      historialData: sorted.filter(p =>
        ['pagado', 'cubierto_por_puja', 'forzado', 'cancelado'].includes(p.estado_pago)
      ),
      stats
    };
  }, [pagosQuery.data, currentTab]);

  const iniciarPagoMutation = useMutation({
    mutationFn: (pagoId: number) => {
      setSelectedPagoId(pagoId);
      return PagoService.iniciarPagoMensual(pagoId);
    },
    onSuccess: (res) => {
      if (res.status === 202 || res.data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
    },
    onError: () => setSelectedPagoId(null)
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: (codigo: string) =>
      PagoService.confirmarPago2FA({ pagoId: selectedPagoId!, codigo_2fa: codigo }),
    onSuccess: (res) => {
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
      twoFaModal.close();
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.message || "Código inválido")
  });

  const handleConfirmIntent = useCallback(() => {
    if (confirmDialog.data?.id) {
      iniciarPagoMutation.mutate(confirmDialog.data.id);
      confirmDialog.close();
    }
  }, [confirmDialog, iniciarPagoMutation]);

  const handlePayRequest = useCallback((row: PagoDto) => {
    const nombreProyecto = row.suscripcion?.proyectoAsociado?.nombre_proyecto || "Proyecto General";
    confirmDialog.confirm('pay_quota', {
      id: row.id,
      mes: row.mes,
      nombreProyecto,
      montoFormateado: formatCurrency(row.monto)
    });
  }, [confirmDialog, formatCurrency]);

  const columns = useMemo<DataTableColumn<PagoDto>[]>(() => [
    {
      id: 'proyecto', label: 'Proyecto / Desarrollo', minWidth: 240,
      render: (row) => (
        <ProjectCell
          nombre={row.suscripcion?.proyectoAsociado?.nombre_proyecto || row.proyectoDirecto?.nombre_proyecto || 'Proyecto en curso'}
          cuotaActual={row.mes}
          totalCuotas={row.suscripcion?.proyectoAsociado?.plazo_inversion}
          cuotasRestantes={row.suscripcion?.meses_a_pagar}
        />
      )
    },
    { id: 'mes', label: 'Cuota', render: (row) => <Chip label={`Mes ${row.mes}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} /> },
    {
      id: 'vencimiento',
      label: 'Vence el',
      render: (row) => (
        <Typography variant="body2" sx={{ color: row.estado_pago === 'vencido' ? 'error.main' : 'text.primary', fontWeight: row.estado_pago === 'vencido' ? 700 : 400 }}>
          {new Date(row.fecha_vencimiento).toLocaleDateString()}
        </Typography>
      )
    },
    { id: 'monto', label: 'Importe', render: (row) => <Typography variant="body2" fontWeight={800}>{formatCurrency(row.monto)}</Typography> },
    {
      id: 'estado_pago', label: 'Estado',
      render: (row) => {
        const { label, color, icon } = getStatusConfig(row.estado_pago);
        return <Chip label={label} color={color} size="small" icon={icon} variant={row.estado_pago === 'vencido' ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />;
      }
    },
    {
      id: 'acciones', label: 'Acción', align: 'right',
      render: (row) => {
        const suscripcionInactiva = row.suscripcion?.activo === false;
        return (
          <Tooltip title={suscripcionInactiva ? "La suscripción está inactiva" : ""}>
            <span>
              <Button
                variant="contained"
                color={row.estado_pago === 'vencido' ? 'error' : 'primary'}
                size="small"
                onClick={(e) => { e.stopPropagation(); handlePayRequest(row); }}
                disabled={iniciarPagoMutation.isPending || suscripcionInactiva}
                startIcon={<Lock fontSize="small" />}
                sx={{ borderRadius: 2, minWidth: 110, fontWeight: 800 }}
              >
                {iniciarPagoMutation.isPending && selectedPagoId === row.id ? '...' : 'Pagar'}
              </Button>
            </span>
          </Tooltip>
        );
      }
    }
  ], [formatCurrency, iniciarPagoMutation.isPending, selectedPagoId, handlePayRequest]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Pagos" subtitle="Control de cuotas y capital invertido." />

      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard title="Próximos" value={formatCurrency(stats.proximosVencimientos)} icon={<Schedule />} color="info" loading={isLoading} />
        <StatCard title="Deuda Vencida" value={formatCurrency(stats.deudaVencida)} icon={<Warning />} color="error" loading={isLoading} />
        <StatCard title="Total Pagado" value={formatCurrency(stats.totalAbonado)} icon={<RocketLaunch />} color="success" loading={isLoading} />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} indicatorColor="primary" textColor="primary">
          <Tab icon={<Schedule />} iconPosition="start" label={<Badge badgeContent={counts.pendientes} color="info" sx={{ px: 1 }}>Pendientes</Badge>} />
          <Tab icon={<Warning />} iconPosition="start" label={<Badge badgeContent={counts.vencidas} color="error" sx={{ px: 1 }}>Vencidas</Badge>} />
          <Tab icon={<ReceiptLong />} iconPosition="start" label="Historial" />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={pagosQuery.error as Error | null}>
        <Box>
          {currentTab === 2 ? (
            <HistorialPagosAgrupado pagos={historialData} />
          ) : (
            <DataTable columns={columns} data={filteredData} getRowKey={(row) => row.id} pagination />
          )}
        </Box>
      </QueryHandler>

      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmIntent} isLoading={iniciarPagoMutation.isPending} />
      <TwoFactorAuthModal
        open={twoFaModal.isOpen}
        onClose={() => { twoFaModal.close(); setSelectedPagoId(null); setTwoFAError(null); }}
        onSubmit={(code) => confirmar2FAMutation.mutate(code)}
        isLoading={confirmar2FAMutation.isPending}
        error={twoFAError}
        title="Confirmar Pago Seguro"
        description="Ingresa el código 2FA para autorizar la transacción."
      />
    </PageContainer>
  );
};

export default MisPagos;