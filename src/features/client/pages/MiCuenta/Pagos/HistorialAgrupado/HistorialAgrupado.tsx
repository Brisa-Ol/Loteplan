import { env } from '@/core/config/env';
import type { PagoDto } from '@/core/types/pago.dto';
import {
  Cancel,
  CheckCircle,
  ErrorOutline,
  ExpandMore,
  ReceiptLong,
  Savings,
  Schedule,
  Stars,
  TrendingUp,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Avatar,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

interface HistorialPagosAgrupadoProps {
  pagos: PagoDto[];
}

interface GroupedSubscription {
  suscripcionId: number | string;
  nombreProyecto: string;
  tipo: 'ahorrista' | 'inversionista';
  totalCuotasProyecto: number;
  mesesRestantesPorGenerar: number;
  fechaInicio?: string;
  fechaCierre?: string;
  pagos: PagoDto[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea moneda fuera del componente para no recrear en cada render */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat(env.defaultLocale, {
    style: 'currency',
    currency: env.defaultCurrency,
    maximumFractionDigits: 0,
  }).format(amount);


const parseLocalDate = (iso: string): Date => {
  if (!iso) return new Date(NaN);
  // Si ya trae hora, usarla tal cual; si no, forzar medianoche local
  return iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`);
};


const formatLocalDate = (iso: string) =>
  parseLocalDate(iso).toLocaleDateString();

/** Ícono semánticamente distinto por estado de pago */
const getEstadoPagoIcon = (estado: PagoDto['estado_pago']) => {
  switch (estado) {
    case 'pagado':
      return (
        <Tooltip title="Pago realizado">
          <CheckCircle color="success" sx={{ fontSize: 18 }} />
        </Tooltip>
      );
    case 'forzado':
      return (
        <Tooltip title="Pago forzado manualmente">
          <CheckCircle color="warning" sx={{ fontSize: 18 }} />
        </Tooltip>
      );
    case 'cubierto_por_puja':
      return (
        <Tooltip title="Cubierto por puja">
          <Stars color="secondary" sx={{ fontSize: 18 }} />
        </Tooltip>
      );
    case 'pendiente':
      return (
        <Tooltip title="Pago pendiente">
          <Schedule sx={{ fontSize: 18, color: 'info.main' }} />
        </Tooltip>
      );
    case 'vencido':
      return (
        <Tooltip title="Pago vencido">
          <ErrorOutline color="error" sx={{ fontSize: 18 }} />
        </Tooltip>
      );
    case 'cancelado':
      return (
        <Tooltip title="Pago cancelado">
          <Cancel sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Tooltip>
      );
    default:
      return (
        <Tooltip title="Estado desconocido">
          <Schedule sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Tooltip>
      );
  }
};

const ROWS_PER_PAGE = 8;

// ─── Componente principal ─────────────────────────────────────────────────────

export const HistorialPagosAgrupado: React.FC<HistorialPagosAgrupadoProps> = ({ pagos }) => {
  const theme = useTheme();

  const [pagination, setPagination] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const grupos = useMemo(() => {
    const map = new Map<string | number, GroupedSubscription>();
    const pagosValidos = pagos.filter(pago => pago.suscripcion !== null);
    pagosValidos.forEach((pago) => {
      const key = pago.id_suscripcion
        ? `sub-${pago.id_suscripcion}`
        : `proj-${pago.id_proyecto}`;

      if (!map.has(key)) {
        const proyecto =
          pago.suscripcion?.proyectoAsociado;

        map.set(key, {
          suscripcionId: key,
          nombreProyecto:
            proyecto?.nombre_proyecto || `Proyecto #${pago.id_proyecto}`,
          totalCuotasProyecto: proyecto?.plazo_inversion || 0,
          mesesRestantesPorGenerar: pago.suscripcion?.meses_a_pagar || 0,
          tipo: pago.suscripcion ? 'ahorrista' : 'inversionista',
          pagos: [],
        });
      }

      map.get(key)?.pagos.push(pago);
    });

    return Array.from(map.values());
  }, [pagos]);

  const handleAccordionChange = (id: string, isExpanded: boolean) => {
    setExpanded((prev) => ({ ...prev, [id]: isExpanded }));
    if (!isExpanded) {
      setPagination((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  if (grupos.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
        }}
      >
        <ReceiptLong sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Sin historial de pagos
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {grupos.map((grupo) => {
        const id = String(grupo.suscripcionId);
        const isInversionista = grupo.tipo === 'inversionista';
        const cancelada = grupo.pagos[0]?.suscripcion?.activo === false;

        // Color temático según tipo
        const themeColor = isInversionista
          ? theme.palette.secondary
          : theme.palette.primary;

        // Total abonado en este grupo
        const totalAbonado = grupo.pagos
          .filter((p) =>
            ['pagado', 'forzado', 'cubierto_por_puja'].includes(p.estado_pago)
          )
          .reduce((acc, p) => acc + Number(p.monto), 0);

        // Progreso de cuotas
        const cuotasPagadas = grupo.pagos.filter((p) =>
          ['pagado', 'forzado', 'cubierto_por_puja'].includes(p.estado_pago)
        ).length;
        const totalCuotas = grupo.totalCuotasProyecto || grupo.pagos.length;
        const progreso = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
        // ✅ NUEVA LÓGICA: Determinar si el proyecto está completado
        const completado = totalCuotas > 0 && cuotasPagadas === totalCuotas;

        // Lógica de colores dinámica
        let borderColor = theme.palette.divider;
        let mainColor = isInversionista ? theme.palette.secondary.main : theme.palette.primary.main;

        if (cancelada) {
          borderColor = theme.palette.error.light;
          mainColor = theme.palette.error.main;
        } else if (completado) {
          // ✅ Si está terminado, usamos el color verde de tu config (success)
          borderColor = theme.palette.success.main;
          mainColor = theme.palette.success.main;
        }
        // Paginación
        const currentPage = pagination[id] || 0;
        const pagosOrdenados = [...grupo.pagos].sort((a, b) => b.mes - a.mes);
        const pagosVisibles = pagosOrdenados.slice(
          currentPage * ROWS_PER_PAGE,
          currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE
        );

        // Rango de fechas del proyecto
        const rangoFechas =
          grupo.fechaInicio && grupo.fechaCierre
            ? `${formatLocalDate(grupo.fechaInicio)} – ${formatLocalDate(grupo.fechaCierre)}`
            : null;

        return (
          <Accordion
            key={id}
            elevation={0}
            expanded={expanded[id] ?? false}
            onChange={(_, isExpanded) => handleAccordionChange(id, isExpanded)}
            sx={{
              mb: 2,
              borderRadius: '12px !important',
              border: `1px solid ${cancelada ? theme.palette.error.light : theme.palette.divider
                }`,
              '&:before': { display: 'none' },
              '&:hover': {
                borderColor: cancelada
                  ? theme.palette.error.main
                  : themeColor.main,
              },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ width: '100%', pr: 1 }}
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: alpha(themeColor.main, 0.1),
                    color: themeColor.main,
                  }}
                >
                  {isInversionista ? <TrendingUp /> : <Savings />}
                </Avatar>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {grupo.nombreProyecto}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      {/* ✅ BADGE DE COMPLETADO */}
                      {completado && !cancelada && (
                        <Chip
                          label="SUSCRIPCION FINALIZADA"
                          size="small"
                          color="success"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                        />
                      )}

                      {cancelada && (
                        <Chip
                          label="SUSCRIPCIÓN CANCELADA"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                        />
                      )}
                    </Stack>
                  </Stack>

                  {/* Fila secundaria: rango de fechas + cuotas pendientes */}
                  <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                    {rangoFechas && (
                      <Typography variant="caption" color="text.secondary">
                        {rangoFechas}
                      </Typography>
                    )}
                    {grupo.mesesRestantesPorGenerar > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'info.main', fontWeight: 700 }}
                      >
                        · {grupo.mesesRestantesPorGenerar} cuotas por pagar
                      </Typography>
                    )}
                  </Stack>

                  {/* Barra de progreso de cuotas */}
                  {totalCuotas > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                      <LinearProgress
                        variant="determinate"
                        value={progreso}
                        sx={{
                          flexGrow: 1,
                          height: 5,
                          borderRadius: 4,
                          bgcolor: alpha(themeColor.main, 0.15),
                          '& .MuiLinearProgress-bar': { bgcolor: themeColor.main },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {cuotasPagadas}/{totalCuotas}
                      </Typography>
                    </Stack>
                  )}
                </Box>


              </Stack>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
              <Divider />
              <Stack divider={<Divider />}>
                {pagosVisibles.map((pago) => (
                  <Box
                    key={pago.id}
                    sx={{
                      p: 2,
                      px: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      {getEstadoPagoIcon(pago.estado_pago)}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Cuota {pago.mes} de {grupo.totalCuotasProyecto || '--'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {['pagado', 'forzado', 'cubierto_por_puja'].includes(pago.estado_pago)
                            ? `Pagado el ${pago.fecha_pago ? formatLocalDate(pago.fecha_pago) : 'Fecha no registrada'}`
                            : `Vence el ${formatLocalDate(pago.fecha_vencimiento)}`}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight={800}>
                        {formatCurrency(pago.monto)}
                      </Typography>
                      {pago.estado_pago === 'cubierto_por_puja' && (
                        <Chip
                          label="Saldado con Puja"
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.55rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>

              {grupo.pagos.length > ROWS_PER_PAGE && (
                <TablePagination
                  component="div"
                  count={grupo.pagos.length}
                  page={currentPage}
                  rowsPerPage={ROWS_PER_PAGE}
                  onPageChange={(_, page) =>
                    setPagination((prev) => ({ ...prev, [id]: page }))
                  }
                  rowsPerPageOptions={[]}
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count}`
                  }
                  sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                />
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};