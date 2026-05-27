import {
  confirmarPagoCuota,
  getAllAdhesionsByUser,
  iniciarPagoCuota,
} from '@/core/api/services/adhesion.service';
import PagoService from '@/core/api/services/pago.service';
import type { AdhesionDto, PagoAdhesionDto } from '@/core/types/adhesion.dto';
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
  Warning,
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
  useTheme,
  type SelectChangeEvent,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useCallback, useMemo, useState } from 'react';
import { DetalleCuotaAdhesionModal } from './Modals/DetalleCuotaAdhesionModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const safeFormatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const safeString = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
  const date = new Date(safeString);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return format(date, 'dd/MM/yyyy', { locale: es });
};

/** Convierte el valor raw de plan_pago a texto legible para el usuario */
const formatPlanPago = (plan: string): string => {
  switch (plan) {
    case 'contado': return 'Contado (1 pago)';
    case '3_cuotas': return '3 cuotas';
    case '6_cuotas': return '6 cuotas';
    case '12_cuotas': return '12 cuotas';
    default: return plan.replace(/_/g, ' ');
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pendiente':
      return { label: 'Pendiente', color: 'info' as const, icon: <Schedule fontSize="small" /> };
    case 'pagado':
      return { label: 'Pagado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
    case 'vencido':
      return { label: 'Vencido', color: 'error' as const, icon: <PriorityHigh fontSize="small" /> };
    case 'cubierto_por_puja':
      return { label: 'Cubierto', color: 'success' as const, icon: <Stars fontSize="small" /> };
    case 'completada':
      return { label: 'Completada', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
    case 'en_curso':
      return { label: 'En curso', color: 'warning' as const, icon: <Schedule fontSize="small" /> };
    case 'cancelada':
    case 'cancelado':
      return { label: 'Cancelada', color: 'default' as const, icon: <Warning fontSize="small" /> };
    default:
      return { label: status.replace(/_/g, ' '), color: 'default' as const, icon: undefined };
  }
};

const getRelativeDate = (fechaISO: string | null): { text: string; isOverdue: boolean } => {
  if (!fechaISO) return { text: '-', isOverdue: false };
  const now = new Date();
  const due = new Date(fechaISO.length === 10 ? `${fechaISO}T00:00:00` : fechaISO);
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return { text: abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`, isOverdue: true };
  }
  if (diffDays === 0) return { text: 'Vence hoy', isOverdue: false };
  if (diffDays === 1) return { text: 'Vence mañana', isOverdue: false };
  if (diffDays <= 7) return { text: `Vence en ${diffDays} días`, isOverdue: false };
  return { text: safeFormatDate(fechaISO), isOverdue: false };
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────

/**
 * Pill que identifica visualmente si una fila es de Plan o de Adhesión.
 * Es la señal primaria de tipo — no depende del texto del botón de acción.
 */
const TypePill: React.FC<{ type: 'plan' | 'adhesion' }> = ({ type }) =>
  type === 'plan' ? (
    <Chip
      label="Plan"
      size="small"
      color="info"
      variant="outlined"
      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, px: 0.25 }}
    />
  ) : (
    <Chip
      label="Adhesión"
      size="small"
      color="warning"
      variant="outlined"
      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, px: 0.25 }}
    />
  );

const ProjectCell = React.memo<{
  nombre: string;
  cuotaActual: number;
  totalCuotas?: number;
  cuotasRestantes?: number;
  type: 'plan' | 'adhesion';
}>(({ nombre, cuotaActual, totalCuotas, cuotasRestantes, type }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
      {nombre}
    </Typography>
    <Stack direction="row" spacing={0.75} alignItems="center" mt={0.5}>
      <TypePill type={type} />
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Cuota {cuotaActual}{totalCuotas ? ` de ${totalCuotas}` : ''}
      </Typography>
      {cuotasRestantes !== undefined && cuotasRestantes > 0 && (
        <Typography variant="caption" color="text.disabled">
          ({cuotasRestantes} restantes)
        </Typography>
      )}
    </Stack>
  </Box>
));

const VencimientoCell: React.FC<{
  fechaVencimiento: string | null;
  estado: string;
  fechaPago?: string | null;
}> = ({ fechaVencimiento, estado, fechaPago }) => {
  const isPagado = ['pagado', 'forzado', 'cubierto_por_puja'].includes(estado);

  // Si ya está pagado, no calculamos días de atraso
  if (isPagado) {
    return (
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {safeFormatDate(fechaVencimiento)}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {fechaPago ? `Pagado el ${safeFormatDate(fechaPago)}` : 'Cuota saldada'}
        </Typography>
      </Box>
    );
  }

  // Si no está pagado, calculamos si está vencido o por vencer
  const { text, isOverdue } = getRelativeDate(fechaVencimiento);
  return (
    <Box>
      <Typography variant="body2" fontWeight={isOverdue ? 800 : 600}>
        {safeFormatDate(fechaVencimiento)}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: isOverdue ? 'error.main' : 'text.secondary', fontWeight: isOverdue ? 700 : 400 }}
      >
        {text}
      </Typography>
    </Box>
  );
};

/** Separador visual entre sección de Plan y sección de Adhesión dentro de la misma tabla */
const TypeSectionDivider: React.FC<{ label: string }> = ({ label }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        px: 2,
        py: 0.75,
        bgcolor: theme.palette.action.hover,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.06em' }}>
        {label}
      </Typography>
    </Box>
  );
};

const EmptyState: React.FC<{ tab: number; hasData?: boolean }> = ({ tab, hasData }) => {
  if (hasData) return null;
  const configs = [
    { icon: '🎉', title: 'No tenés cuotas pendientes', subtitle: 'Estás al día con todos tus pagos.' },
    { icon: '✅', title: 'Sin cuotas vencidas', subtitle: 'Excelente, no tenés deudas atrasadas.' },
    { icon: '📝', title: 'Sin adhesiones registradas', subtitle: 'Aún no tenés planes de adhesión.' },
  ];
  const config = configs[tab] ?? { icon: '✅', title: 'Sin datos', subtitle: '' };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
      <Typography fontSize={48}>{config.icon}</Typography>
      <Typography variant="h6" fontWeight={700}>{config.title}</Typography>
      <Typography variant="body2" color="text.secondary">{config.subtitle}</Typography>
    </Box>
  );
};

const TableSection: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({
  title,
  count,
  children,
}) => {
  const theme = useTheme();
  if (count === 0) return null;
  return (
    <Box mb={3}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {title}
        </Typography>
        <Chip label={count} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.75rem', height: 22 }} />
      </Stack>
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

const MisPagos: React.FC = () => {
  const formatCurrency = useCurrencyFormatter();
  const twoFaModal = useModal();
  const twoFaAdhesionModal = useModal();
  const confirmDialog = useConfirmDialog();

const detalleAdhesionModal = useModal();
  const [selectedAdhesionDetail, setSelectedAdhesionDetail] = useState<AdhesionDto | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | 'todos'>('todos');

  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const [adhesionPagoId, setAdhesionPagoId] = useState<number | null>(null);
  const [twoFAErrorAdhesion, setTwoFAErrorAdhesion] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: PagoService.getMyPayments,
  });

  const adhesionesQuery = useQuery<AdhesionDto[]>({
    queryKey: ['misAdhesiones'],
    queryFn: async () => {
      const res = await getAllAdhesionsByUser();
      return res.data.data;
    },
  });

  const isLoading = pagosQuery.isLoading || adhesionesQuery.isLoading;

  // ─── Proyectos disponibles para el filtro ────────────────────────────────

  const listaProyectos = useMemo(() => {
    const map = new Map<number, string>();
    (pagosQuery.data ?? []).forEach((p) => {
      const proj = p.suscripcion?.proyectoAsociado ?? p.proyectoDirecto;
      if (proj) map.set(proj.id, proj.nombre_proyecto);
    });
    (adhesionesQuery.data ?? []).forEach((a) => {
      if (a.proyecto) map.set(a.proyecto.id, a.proyecto.nombre_proyecto);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [pagosQuery.data, adhesionesQuery.data]);

  // ─── Procesamiento de cuotas de Plan ────────────────────────────────────

  const { planPendientes, planVencidas, planHistorial, planStats } = useMemo(() => {
    let data = pagosQuery.data ?? [];
    if (selectedProyectoId !== 'todos') {
      data = data.filter((p) => p.id_proyecto === Number(selectedProyectoId));
    }

    const stats = { proximosVencimientos: 0, deudaVencida: 0, totalAbonado: 0 };
    data.forEach((p) => {
      const monto = Number(p.monto ?? 0);
      if (p.estado_pago === 'pendiente') stats.proximosVencimientos += monto;
      else if (p.estado_pago === 'vencido') stats.deudaVencida += monto;
      else if (['pagado', 'cubierto_por_puja'].includes(p.estado_pago)) stats.totalAbonado += monto;
    });

    const sorted = [...data].sort((a, b) => a.mes - b.mes);
    return {
      planPendientes: sorted.filter((p) => p.estado_pago === 'pendiente'),
      planVencidas: sorted.filter((p) => p.estado_pago === 'vencido'),
      planHistorial: sorted.filter((p) =>
        ['pagado', 'cubierto_por_puja', 'forzado', 'cancelado'].includes(p.estado_pago)
      ),
      planStats: stats,
    };
  }, [pagosQuery.data, selectedProyectoId]);

  // ─── Procesamiento de cuotas de Adhesión ────────────────────────────────

  const {
    adhesionCuotasPendientes,
    adhesionCuotasVencidas,
    adhesionHistorial,
    adhesionResumenes,
    adhesionCounts,
    adhesionStats,
  } = useMemo(() => {
    const raw = adhesionesQuery.data;
    const adhesiones: AdhesionDto[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.data)
        ? (raw as any).data
        : [];

    let quotas: (PagoAdhesionDto & { adhesion: AdhesionDto })[] = [];
    adhesiones.forEach((adh) => {
      (adh.pagos ?? []).forEach((pago) => quotas.push({ ...pago, adhesion: adh }));
    });

    if (selectedProyectoId !== 'todos') {
      quotas = quotas.filter((q) => q.adhesion.id_proyecto === Number(selectedProyectoId));
    }

    const stats = { proximosVencimientos: 0, deudaVencida: 0, totalAbonado: 0 };
    quotas.forEach((q) => {
      const monto = Number(q.monto ?? 0);
      if (q.estado === 'pendiente') stats.proximosVencimientos += monto;
      else if (q.estado === 'vencido') stats.deudaVencida += monto;
      else if (['pagado', 'forzado', 'cubierto_por_puja'].includes(q.estado)) stats.totalAbonado += monto;
    });

    let activas = 0;
    adhesiones.forEach((adh) => {
      if (['pendiente', 'en_curso'].includes(adh.estado)) activas++;
    });

    return {
      adhesionCuotasPendientes: quotas.filter((q) => q.estado === 'pendiente'),
      adhesionCuotasVencidas: quotas.filter((q) => q.estado === 'vencido'),
      adhesionHistorial: quotas.filter((q) =>
        ['pagado', 'forzado', 'cancelado'].includes(q.estado)
      ),
      adhesionResumenes: adhesiones,
      adhesionCounts: { activas },
      adhesionStats: stats,
    };
  }, [adhesionesQuery.data, selectedProyectoId]);

  // Totales para badges y stats cards
  const totalPendientes = planPendientes.length + adhesionCuotasPendientes.length;
  const totalVencidas = planVencidas.length + adhesionCuotasVencidas.length;

  // ─── Mutaciones ─────────────────────────────────────────────────────────

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
    onError: (err: any) => setTwoFAError(err.response?.data?.message ?? 'Código inválido'),
  });

  const iniciarPagoAdhesionMutation = useMutation({
    mutationFn: ({ adhesionId, numeroCuota }: { adhesionId: number; numeroCuota: number }) =>
      iniciarPagoCuota({ adhesionId, numeroCuota }),
    onSuccess: (res) => {
      setAdhesionPagoId(res.data.pagoAdhesionId!);
      setTwoFAErrorAdhesion(null);
      twoFaAdhesionModal.open();
      confirmDialog.close();
    },
  });

  const confirmarPagoAdhesionMutation = useMutation({
    mutationFn: (codigo: string) =>
      confirmarPagoCuota({ pagoAdhesionId: adhesionPagoId!, codigo_2fa: codigo }),
    onSuccess: (res) => {
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
      twoFaAdhesionModal.close();
    },
    onError: (err: any) =>
      setTwoFAErrorAdhesion(err.response?.data?.message ?? 'Código inválido'),
  });

  const isPaymentPending =
    iniciarPagoMutation.isPending ||
    iniciarPagoAdhesionMutation.isPending ||
    confirmarPagoAdhesionMutation.isPending;

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleConfirmIntent = useCallback(() => {
    if (confirmDialog.data?.esAdhesion) {
      iniciarPagoAdhesionMutation.mutate({
        adhesionId: confirmDialog.data.adhesionId,
        numeroCuota: confirmDialog.data.numeroCuota,
      });
    } else if (confirmDialog.data?.id) {
      iniciarPagoMutation.mutate(confirmDialog.data.id);
      confirmDialog.close();
    }
  }, [confirmDialog, iniciarPagoMutation, iniciarPagoAdhesionMutation]);

  const handlePayPlanRequest = useCallback(
    (row: PagoDto) => {
      confirmDialog.confirm('pay_quota', {
        id: row.id,
        mes: row.mes,
        nombreProyecto:
          row.suscripcion?.proyectoAsociado?.nombre_proyecto ?? 'Proyecto General',
        montoFormateado: formatCurrency(row.monto),
        fechaVencimiento: safeFormatDate(row.fecha_vencimiento),
        esAdhesion: false,
      });
    },
    [confirmDialog, formatCurrency]
  );

  const handlePayAdhesionRequest = useCallback(
    (row: PagoAdhesionDto & { adhesion: AdhesionDto }) => {
      confirmDialog.confirm('pay_quota', {
        adhesionId: row.adhesion.id,
        numeroCuota: row.numero_cuota,
        mes: row.numero_cuota,
        nombreProyecto:
          row.adhesion.proyecto?.nombre_proyecto ?? `Adhesión #${row.adhesion.id}`,
        montoFormateado: formatCurrency(Number(row.monto)),
        fechaVencimiento: safeFormatDate(row.fecha_vencimiento),
        esAdhesion: true,
      });
    },
    [confirmDialog, formatCurrency]
  );
const handleOpenAdhesionDetail = useCallback(
    (adhesion: AdhesionDto) => {
      setSelectedAdhesionDetail(adhesion);
      detalleAdhesionModal.open();
    },
    [detalleAdhesionModal]
  );
  // ─── Columnas ────────────────────────────────────────────────────────────

  /** Columnas para cuotas de Plan (tabs 0, 1 y historial) */
  const planColumns = useMemo<DataTableColumn<PagoDto>[]>(
    () => [
      {
        id: 'proyecto',
        label: 'Concepto / Desarrollo',
        minWidth: 240,
        render: (row) => (
          <ProjectCell
            nombre={
              row.suscripcion?.proyectoAsociado?.nombre_proyecto ??
              row.proyectoDirecto?.nombre_proyecto ??
              'Proyecto en curso'
            }
            cuotaActual={row.mes}
            totalCuotas={row.suscripcion?.proyectoAsociado?.plazo_inversion}
            cuotasRestantes={row.suscripcion?.meses_a_pagar}
            type="plan"
          />
        ),
      },
      {
        id: 'vencimiento',
        label: 'Vencimiento',
        render: (row) => (
          <VencimientoCell
            fechaVencimiento={row.fecha_vencimiento}
            estado={row.estado_pago}
            fechaPago={row.fecha_pago}
          />
        ),
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
        id: 'estado',
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
              sx={{ fontWeight: 700 }}
            />
          );
        },
      },
      {
        id: 'acciones',
        label: 'Acción',
        align: 'right',
        render: (row) => {
          if (['pagado', 'cubierto_por_puja', 'forzado'].includes(row.estado_pago)) return null;
          const suscripcionInactiva = row.suscripcion?.activo === false;
          return (
            <Tooltip title={suscripcionInactiva ? 'La suscripción está inactiva' : ''}>
              <span>
                <Button
                  variant="contained"
                  color={row.estado_pago === 'vencido' ? 'error' : 'primary'}
                  size="small"
                  onClick={() => handlePayPlanRequest(row)}
                  disabled={isPaymentPending || suscripcionInactiva}
                  startIcon={<Lock fontSize="small" />}
                  sx={{ borderRadius: 2, minWidth: 100, fontWeight: 800 }}
                >
                  Pagar
                </Button>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [formatCurrency, isPaymentPending, handlePayPlanRequest]
  );

  /** Columnas para cuotas de Adhesión (tabs 0, 1, 2 y historial) */
  const adhesionQuotasColumns = useMemo<
    DataTableColumn<PagoAdhesionDto & { adhesion: AdhesionDto }>[]
  >(
    () => [
      {
        id: 'proyecto',
        label: 'Concepto / Desarrollo',
        minWidth: 240,
        render: (row) => (
          <ProjectCell
            nombre={
              row.adhesion.proyecto?.nombre_proyecto ??
              `Adhesión #${row.adhesion.id}`
            }
            cuotaActual={row.numero_cuota}
            totalCuotas={row.adhesion.cuotas_totales}
            type="adhesion"
          />
        ),
      },
      {
        id: 'vencimiento',
        label: 'Vencimiento',
        render: (row) => (
          <VencimientoCell
            fechaVencimiento={row.fecha_vencimiento}
            estado={row.estado}
            fechaPago={row.fecha_pago}
          />
        ),
      },
      {
        id: 'monto',
        label: 'Importe',
        render: (row) => (
          <Typography variant="body2" fontWeight={800}>
            {formatCurrency(Number(row.monto))}
          </Typography>
        ),
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (row) => {
          const { label, color, icon } = getStatusConfig(row.estado);
          return (
            <Chip
              label={label}
              color={color}
              size="small"
              icon={icon}
              variant={row.estado === 'vencido' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700 }}
            />
          );
        },
      },
      {
        id: 'acciones',
        label: 'Acción',
        align: 'right',
        render: (row) => {
          if (['pagado', 'forzado'].includes(row.estado)) return null;
          return (
            <Button
              variant="contained"
              color={row.estado === 'vencido' ? 'error' : 'warning'}
              size="small"
              onClick={() => handlePayAdhesionRequest(row)}
              disabled={isPaymentPending}
              startIcon={<Lock fontSize="small" />}
              sx={{ borderRadius: 2, minWidth: 100, fontWeight: 800 }}
            >
              Pagar
            </Button>
          );
        },
      },
    ],
    [formatCurrency, isPaymentPending, handlePayAdhesionRequest]
  );

  /** Columnas para el resumen general de adhesiones (tab 2) */
  const adhesionResumenColumns = useMemo<DataTableColumn<AdhesionDto>[]>(
    () => [
      {
        id: 'proyecto_adhesion',
        label: 'Detalle de plan de adhesión',
        minWidth: 260,
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
              {row.proyecto?.nombre_proyecto ?? `Adhesión #${row.id}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              Plan: {formatPlanPago(row.plan_pago)} · {Number(row.porcentaje_adhesion)}% del valor móvil
            </Typography>
          </Box>
        ),
      },
      {
        id: 'progreso',
        label: 'Progreso',
        render: (row) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              {row.cuotas_pagadas} / {row.cuotas_totales}
            </Typography>
            {row.estado === 'completada' && <CheckCircle color="success" fontSize="small" />}
          </Stack>
        ),
      },
      {
        id: 'monto',
        label: 'Capital comprometido',
        render: (row) => (
          <Typography variant="body2" fontWeight={800}>
            {formatCurrency(Number(row.monto_total_adhesion))}
          </Typography>
        ),
      },
      {
        id: 'estado_adhesion',
        label: 'Estado general',
        render: (row) => {
          const { label, color, icon } = getStatusConfig(row.estado);
          const tieneVencida = (row.pagos ?? []).some((p) => p.estado === 'vencido');
          return (
            <Chip
              label={label}
              color={color}
              size="small"
              icon={icon}
              variant={tieneVencida ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700 }}
            />
          );
        },
      },
{
        id: 'acciones',
        label: 'Acción',
        align: 'right',
        render: (row) => (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => handleOpenAdhesionDetail(row)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Ver detalle
          </Button>
        ),
      },
    ],
    [formatCurrency, handleOpenAdhesionDetail] // ✨ Agregá la dependencia acá
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  const hasPendientes = planPendientes.length > 0 || adhesionCuotasPendientes.length > 0;
  const hasVencidas = planVencidas.length > 0 || adhesionCuotasVencidas.length > 0;

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Mis pagos"
        subtitle="Administrá tus cuotas de plan y de adhesión en un solo lugar."
      />

      {/* ── Stat cards ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <StatCard
          title="Próximos vencimientos"
          value={formatCurrency(
            planStats.proximosVencimientos + adhesionStats.proximosVencimientos
          )}
          icon={<Schedule />}
          color="info"
          subtitle={
            totalPendientes > 0
              ? `${totalPendientes} cuota${totalPendientes > 1 ? 's' : ''} pendiente${totalPendientes > 1 ? 's' : ''}`
              : 'Todo al día'
          }
        />
        <StatCard
          title="Deuda vencida"
          value={formatCurrency(
            planStats.deudaVencida + adhesionStats.deudaVencida
          )}
          icon={<Warning />}
          color="error"
          subtitle={
            totalVencidas > 0
              ? `${totalVencidas} cuota${totalVencidas > 1 ? 's' : ''} vencida${totalVencidas > 1 ? 's' : ''}`
              : 'Sin deudas vencidas'
          }
        />
        <StatCard
          title="Total abonado"
          value={formatCurrency(planStats.totalAbonado + adhesionStats.totalAbonado)}
          icon={<TrendingUp />}
          color="success"
          subtitle="Plan + adhesiones acumulado"
        />
      </Stack>

      {/* ── Tabs + Filtro ── */}
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
              <Badge badgeContent={totalPendientes} color="info" sx={{ px: 1 }}>
                Pendientes
              </Badge>
            }
          />
          <Tab
            icon={<Warning />}
            iconPosition="start"
            label={
              <Badge badgeContent={totalVencidas} color="error" sx={{ px: 1 }}>
                Vencidas
              </Badge>
            }
          />
          <Tab
            icon={<ReceiptLong />}
            iconPosition="start"
            label={
              <Badge badgeContent={adhesionCounts.activas} color="warning" sx={{ px: 1 }}>
                Mis adhesiones
              </Badge>
            }
          />
          <Tab icon={<CheckCircle />} iconPosition="start" label="Historial Pagos del Plan" />
        </Tabs>

        {currentTab < 2 && (
          <FormControl size="small" sx={{ minWidth: 220, mb: { xs: 2, md: 0 }, mr: { md: 1 } }}>
            <InputLabel id="select-proyecto">Filtrar por proyecto</InputLabel>
            <Select
              labelId="select-proyecto"
              value={selectedProyectoId}
              label="Filtrar por proyecto"
              onChange={(e: SelectChangeEvent) => {
                setSelectedProyectoId(e.target.value);
                setCurrentTab(0);
              }}
              sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
            >
              <MenuItem value="todos">Todos los proyectos</MenuItem>
              {listaProyectos.map((proj) => (
                <MenuItem key={proj.id} value={proj.id.toString()}>
                  {proj.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <QueryHandler
        isLoading={isLoading}
        error={(pagosQuery.error ?? adhesionesQuery.error) as Error | null}
      >
        <Box>
          {/* ── Tab 0: Pendientes ── muestra Plan + Adhesión */}
          {currentTab === 0 && (
            hasPendientes ? (
              <Stack spacing={0}>
                <TableSection title="Cuotas de plan" count={planPendientes.length}>
                  <TypeSectionDivider label="Plan de ahorro" />
                  <DataTable
                    columns={planColumns}
                    data={planPendientes}
                    getRowKey={(row) => row.id}
                    pagination
                  />
                </TableSection>

                <TableSection title="Cuotas de adhesión" count={adhesionCuotasPendientes.length}>
                  <TypeSectionDivider label="Adhesión" />
                  <DataTable
                    columns={adhesionQuotasColumns}
                    data={adhesionCuotasPendientes}
                    getRowKey={(row) => row.id}
                    pagination
                  />
                </TableSection>
              </Stack>
            ) : (
              <EmptyState tab={0} />
            )
          )}

          {/* ── Tab 1: Vencidas ── muestra Plan + Adhesión */}
          {currentTab === 1 && (
            hasVencidas ? (
              <Stack spacing={0}>
                <TableSection title="Cuotas de plan vencidas" count={planVencidas.length}>
                  <TypeSectionDivider label="Plan de ahorro" />
                  <DataTable
                    columns={planColumns}
                    data={planVencidas}
                    getRowKey={(row) => row.id}
                    pagination
                  />
                </TableSection>

                <TableSection title="Cuotas de adhesión vencidas" count={adhesionCuotasVencidas.length}>
                  <TypeSectionDivider label="Adhesión" />
                  <DataTable
                    columns={adhesionQuotasColumns}
                    data={adhesionCuotasVencidas}
                    getRowKey={(row) => row.id}
                    pagination
                  />
                </TableSection>
              </Stack>
            ) : (
              <EmptyState tab={1} />
            )
          )}

          {/* ── Tab 2: Mis Adhesiones ── Resumen + cuotas activas */}
          {currentTab === 2 && (
            adhesionResumenes.length === 0 ? (
              <EmptyState tab={2} />
            ) : (
              <Stack spacing={4}>
                <TableSection title="Resumen de mis adhesiones" count={adhesionResumenes.length}>
                  <DataTable
                    columns={adhesionResumenColumns}
                    data={adhesionResumenes}
                    getRowKey={(row) => row.id}
                    pagination
                  />
                </TableSection>

                {/* Cuotas pendientes/vencidas de adhesión también visibles aquí */}
                {(adhesionCuotasPendientes.length > 0 || adhesionCuotasVencidas.length > 0) && (
                  <TableSection
                    title="Cuotas por pagar"
                    count={adhesionCuotasPendientes.length + adhesionCuotasVencidas.length}
                  >
                    <DataTable
                      columns={adhesionQuotasColumns}
                      data={[...adhesionCuotasVencidas, ...adhesionCuotasPendientes]}
                      getRowKey={(row) => row.id}
                      pagination
                    />
                  </TableSection>
                )}
              </Stack>
            )
          )}

          {/* ── Tab 3: Historial ── Plan y Adhesión en secciones separadas */}
          {currentTab === 3 && (
            <>
              <TableSection
                title="Historial de cuotas de plan"
                count={planHistorial.length}
              >
                <TypeSectionDivider label="Plan de ahorro" />
                <DataTable
                  columns={planColumns}
                  data={planHistorial}
                  getRowKey={(row) => row.id}
                  pagination
                />
              </TableSection>
            </>
          )}
        </Box>
      </QueryHandler>

      {/* ── Modales ── */}
      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmIntent}
        isLoading={isPaymentPending}
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
        title="Confirmar pago seguro"
      />
      <TwoFactorAuthModal
        open={twoFaAdhesionModal.isOpen}
        onClose={() => {
          twoFaAdhesionModal.close();
          setAdhesionPagoId(null);
          setTwoFAErrorAdhesion(null);
        }}
        onSubmit={(code) => confirmarPagoAdhesionMutation.mutate(code)}
        isLoading={confirmarPagoAdhesionMutation.isPending}
        error={twoFAErrorAdhesion}
        title="Confirmar pago de adhesión"
      />
<DetalleCuotaAdhesionModal
        open={detalleAdhesionModal.isOpen}
        onClose={() => {
          detalleAdhesionModal.close();
          setSelectedAdhesionDetail(null);
        }}
        adhesion={selectedAdhesionDetail}
        formatCurrency={formatCurrency}
        isPaymentPending={isPaymentPending}
        onPagar={(adhesion, cuota) => {
          detalleAdhesionModal.close(); // Cerramos el detalle para no amontonar modales
          handlePayAdhesionRequest({ ...cuota, adhesion }); // Reutilizamos tu handler de pago existente
        }}
      />
    </PageContainer>
  );
};

export default MisPagos;