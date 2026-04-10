// src/features/client/pages/Pagos/MisPagos.tsx

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import {
  ConfirmDialog,
  DataTable,
  PageContainer,
  PageHeader,
  QueryHandler,
  StatCard,
  useConfirmDialog,
  useModal,
  type DataTableColumn,
} from '@/shared';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import {
  CheckCircle,
  Lock,
  PriorityHigh,
  ReceiptLong,
  Schedule,
  Stars,
  TrendingUp,
  Warning
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { HistorialPagosAgrupado } from './HistorialAgrupado/HistorialAgrupado';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pendiente':
      return { label: 'PENDIENTE', color: 'info' as const, icon: <Schedule fontSize="small" /> };
    case 'pagado':
      return { label: 'PAGADO', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
    case 'vencido':
      return { label: 'VENCIDO', color: 'error' as const, icon: <PriorityHigh fontSize="small" /> };
    case 'cubierto_por_puja':
      return { label: 'CUBIERTO', icon: <Stars fontSize="small" sx={{ color:'success.secondary' }} /> };
    case 'cancelado':
      return { label: 'CANCELADO', color: 'default' as const, icon: <Warning fontSize="small" /> };
    default:
      return { label: status.toUpperCase(), color: 'default' as const, icon: undefined };
  }
};

/** Devuelve texto relativo a la fecha de vencimiento. */
const getRelativeDate = (fechaISO: string): { text: string; isOverdue: boolean } => {
  const now = new Date();
  const due = new Date(fechaISO);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      text: abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`,
      isOverdue: true,
    };
  }
  if (diffDays === 0) return { text: 'Vence hoy', isOverdue: false };
  if (diffDays === 1) return { text: 'Vence mañana', isOverdue: false };
  if (diffDays <= 7) return { text: `Vence en ${diffDays} días`, isOverdue: false };
  return { text: due.toLocaleDateString(), isOverdue: false };
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const ProjectCell = React.memo<{
  nombre: string;
  cuotaActual: number;
  totalCuotas?: number;
  cuotasRestantes?: number;
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
          sx={{
            height: 18,
            fontSize: '0.6rem',
            bgcolor: 'action.hover',
            fontWeight: 700,
            border: 'none',
          }}
        />
      )}
    </Stack>
  </Box>
));

/** Estado vacío contextual por tab */
const EmptyState: React.FC<{ tab: number }> = ({ tab }) => {
  const config =
    tab === 0
      ? {
        icon: '🎉',
        title: 'No tenés cuotas pendientes',
        subtitle: 'Estás al día con todos tus pagos.',
      }
      : {
        icon: '✅',
        title: 'Sin cuotas vencidas',
        subtitle: 'No tenés pagos atrasados en este momento.',
      };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 1,
      }}
    >
      <Typography fontSize={48}>{config.icon}</Typography>
      <Typography variant="h6" fontWeight={700}>
        {config.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {config.subtitle}
      </Typography>
    </Box>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

const MisPagos: React.FC = () => {
  const formatCurrency = useCurrencyFormatter();
  const twoFaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | 'todos'>('todos');

  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: PagoService.getMyPayments,
  });

  const isLoading = pagosQuery.isLoading;

  const listaProyectos = useMemo(() => {
    const data = pagosQuery.data || [];
    const proyectosMap = new Map<number, string>();
    data.forEach((p) => {
      const proj = p.suscripcion?.proyectoAsociado || p.proyectoDirecto;
      if (proj) proyectosMap.set(proj.id, proj.nombre_proyecto);
    });
    return Array.from(proyectosMap.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [pagosQuery.data]);

  const { filteredData, counts, historialData, stats } = useMemo(() => {
    let data = pagosQuery.data || [];

    if (selectedProyectoId !== 'todos') {
      data = data.filter((p) => p.id_proyecto === Number(selectedProyectoId));
    }

    const counts = { pendientes: 0, vencidas: 0, pagadas: 0 };
    const stats = { deudaVencida: 0, proximosVencimientos: 0, totalAbonado: 0 };

    data.forEach((p) => {
      const monto = Number(p.monto || 0);
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

    const sorted = [...data].sort((a, b) => b.mes - a.mes);

    return {
      filteredData:
        currentTab === 0
          ? sorted.filter((p) => p.estado_pago === 'pendiente')
          : sorted.filter((p) => p.estado_pago === 'vencido'),
      counts,
      historialData: sorted.filter((p) =>
        ['pagado', 'cubierto_por_puja', 'forzado', 'cancelado'].includes(p.estado_pago)
      ),
      stats,
    };
  }, [pagosQuery.data, currentTab, selectedProyectoId]);

  // ── Al cambiar de proyecto, resetear al tab 0 para evitar tabla vacía sin aviso
  const handleProyectoChange = (event: SelectChangeEvent) => {
    setSelectedProyectoId(event.target.value);
    setCurrentTab(0);
  };

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
    onError: () => setSelectedPagoId(null),
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: (codigo: string) =>
      PagoService.confirmarPago2FA({ pagoId: selectedPagoId!, codigo_2fa: codigo }),
    onSuccess: (res) => {
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
      twoFaModal.close();
    },
    onError: (err: any) =>
      setTwoFAError(err.response?.data?.message || 'Código inválido'),
  });

  const handleConfirmIntent = useCallback(() => {
    if (confirmDialog.data?.id) {
      iniciarPagoMutation.mutate(confirmDialog.data.id);
      confirmDialog.close();
    }
  }, [confirmDialog, iniciarPagoMutation]);

  const handlePayRequest = useCallback(
    (row: PagoDto) => {
      const nombreProyecto =
        row.suscripcion?.proyectoAsociado?.nombre_proyecto || 'Proyecto General';
      confirmDialog.confirm('pay_quota', {
        id: row.id,
        mes: row.mes,
        nombreProyecto,
        montoFormateado: formatCurrency(row.monto),
        // ✅ Fecha de vencimiento incluida para contexto en el diálogo
        fechaVencimiento: new Date(row.fecha_vencimiento).toLocaleDateString(),
      });
    },
    [confirmDialog, formatCurrency]
  );

  const isPaymentPending = iniciarPagoMutation.isPending;

  const columns = useMemo<DataTableColumn<PagoDto>[]>(
    () => [
      {
        id: 'proyecto',
        label: 'Proyecto / Desarrollo',
        minWidth: 240,
        render: (row) => (
          <ProjectCell
            nombre={
              row.suscripcion?.proyectoAsociado?.nombre_proyecto ||
              row.proyectoDirecto?.nombre_proyecto ||
              'Proyecto en curso'
            }
            cuotaActual={row.mes}
            totalCuotas={row.suscripcion?.proyectoAsociado?.plazo_inversion}
            cuotasRestantes={row.suscripcion?.meses_a_pagar}
          />
        ),
      },
      // ✅ Columna "Cuota" eliminada — la info ya está en ProjectCell
      {
        id: 'vencimiento',
        label: 'Vencimiento',
        render: (row) => {
          const { text, isOverdue } = getRelativeDate(row.fecha_vencimiento);
          return (
            <Box>
              <Typography variant="body2" fontWeight={isOverdue ? 700 : 400}>
                {new Date(row.fecha_vencimiento).toLocaleDateString()}
              </Typography>
              {isOverdue && (
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  {text}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        id: 'monto',
        label: 'Importe',
        render: (row) => (
          <Typography variant="body2" fontWeight={800}>
            {formatCurrency(row.monto)}
          </Typography>
        ),
      },
      {
        id: 'estado_pago',
        label: 'Estado',
        render: (row) => {
          const { label, color, icon } = getStatusConfig(row.estado_pago);
          return (
            <Chip
              label={label}
              color={color}
              size="small"
              icon={icon}
              variant={row.estado_pago === 'vencido' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        id: 'acciones',
        label: 'Acción',
        align: 'right',
        render: (row) => {
          const suscripcionInactiva = row.suscripcion?.activo === false;
          const isPaying = isPaymentPending && selectedPagoId === row.id;

          return (
            <Tooltip title={suscripcionInactiva ? 'La suscripción está inactiva' : ''}>
              <span>
                <Button
                  variant="contained"
                  color={row.estado_pago === 'vencido' ? 'error' : 'primary'}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayRequest(row);
                  }}
                  // ✅ Deshabilitar toda la tabla mientras hay un pago en curso
                  disabled={isPaymentPending || suscripcionInactiva}
                  startIcon={<Lock fontSize="small" />}
                  sx={{ borderRadius: 2, minWidth: 110, fontWeight: 800 }}
                >
                  {isPaying ? '...' : 'Pagar'}
                </Button>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [formatCurrency, isPaymentPending, selectedPagoId, handlePayRequest]
  );

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Pagos" subtitle="Control de cuotas y capital invertido." />

      {/* ✅ StatCards visibles con los datos calculados */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <StatCard
          title="Próximos vencimientos"
          value={formatCurrency(stats.proximosVencimientos)}
          icon={<Schedule />}
          color="info"
        />
        <StatCard
          title="Deuda vencida"
          value={formatCurrency(stats.deudaVencida)}
          icon={<Warning />}
          color="error"
        />
        <StatCard
          title="Total abonado"
          value={formatCurrency(stats.totalAbonado)}
          icon={<TrendingUp />}
          color="success"
        />
      </Stack>

      {/* Contenedor de Tabs y Filtro en la misma línea */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          gap: 2,
        }}
      >
        {/* ✅ Scrollable en móvil para que no se corten los tabs */}
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<Schedule />}
            iconPosition="start"
            label={
              <Badge badgeContent={counts.pendientes} color="info" sx={{ px: 1 }}>
                Pendientes
              </Badge>
            }
          />
          <Tab
            icon={<Warning />}
            iconPosition="start"
            label={
              <Badge badgeContent={counts.vencidas} color="error" sx={{ px: 1 }}>
                Vencidas
              </Badge>
            }
          />
          <Tab icon={<ReceiptLong />} iconPosition="start" label="Historial" />
        </Tabs>

        <FormControl
          size="small"
          sx={{
            minWidth: 220,
            mb: { xs: 2, md: 0 },
            mr: { md: 1 },
          }}
        >
          <InputLabel id="select-proyecto-label">Filtrar por Proyecto</InputLabel>
          <Select
            labelId="select-proyecto-label"
            value={selectedProyectoId}
            label="Filtrar por Proyecto"
            onChange={handleProyectoChange}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 240 },
              },
            }}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              '& .MuiSelect-select': { py: 1 },
            }}
          >
            <MenuItem value="todos">Todos los proyectos</MenuItem>
            {listaProyectos.map((proj) => (
              <MenuItem key={proj.id} value={proj.id.toString()}>
                {proj.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <QueryHandler isLoading={isLoading} error={pagosQuery.error as Error | null}>
        <Box>
          {currentTab === 2 ? (
            <HistorialPagosAgrupado pagos={historialData} />
          ) : filteredData.length === 0 ? (
            // ✅ Empty state contextual por tab
            <EmptyState tab={currentTab} />
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              getRowKey={(row) => row.id}
              pagination
            />
          )}
        </Box>
      </QueryHandler>

      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmIntent}
        isLoading={iniciarPagoMutation.isPending}
      />
      <TwoFactorAuthModal
        open={twoFaModal.isOpen}
        onClose={() => {
          twoFaModal.close();
          setSelectedPagoId(null);
          setTwoFAError(null);
        }}
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