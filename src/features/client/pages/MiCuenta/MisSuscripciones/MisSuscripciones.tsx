// src/components/domain/suscripciones/MisSuscripciones.tsx

import { SnackbarContext } from "@/core/context/SnackbarContext";
import type { AdhesionDto, PlanPagoAdhesion } from "@/core/types/adhesion.dto";
import type { ResumenCuentaDto } from "@/core/types/resumenCuenta.dto";
import type {
    SuscripcionCanceladaDto,
    SuscripcionDto,
} from "@/core/types/suscripcion.dto";
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
} from "@/shared";
import TwoFactorAuthModal from "@/shared/components/domain/modals/TwoFactorAuthModal";
import {
    AccountBalanceWallet,
    CalendarMonth,
    Cancel,
    CheckCircle,
    History as HistoryIcon,
    MonetizationOn,
    PauseCircleOutline,
    PlayCircleFilled,
    ReceiptLong,
    Schedule,
    Token as TokenIcon,
    TrendingUp,
    Visibility
} from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrencyFormatter } from "../../../hooks/useCurrencyFormatter";
import { useSuscripciones } from "../../../hooks/useSuscripciones";
import { DetalleCuotaModal } from "./modals/DetalleCuotaModal";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanPagoAdhesion, string> = {
    contado: "Pago contado",
    "3_cuotas": "3 cuotas",
    "6_cuotas": "6 cuotas",
};

const getPlanLabel = (plan: PlanPagoAdhesion): string =>
    PLAN_LABELS[plan] ?? plan;

const formatDate = (iso?: string | null): string => {
    if (!iso) return "—";
    const dateStr = iso.includes("T") ? iso : `${iso}T00:00:00`;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return format(date, "dd/MM/yyyy", { locale: es });
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: CARD DE PLAN VIGENTE
// ─────────────────────────────────────────────────────────────────────────────

interface PlanVigenteCardProps {
    suscripcion: SuscripcionDto;
    resumen: ResumenCuentaDto | undefined;
    formatCurrency: (val: number) => string;
    onViewProject: () => void;
    onViewAnalysis: () => void;
    onCancel: () => void;
    isLoadingResumenes: boolean;
}

const PlanVigenteCard: React.FC<PlanVigenteCardProps> = ({
    suscripcion: s,
    resumen: r,
    formatCurrency,
    onViewProject,
    onViewAnalysis,
    onCancel,
    isLoadingResumenes,
}) => {
    const theme = useTheme();

    const hasOverdue = (r?.cuotas_vencidas ?? 0) > 0;
    const isStandby = s.standby_active && !!s.standby_end_date;
    const porcentaje = r?.porcentaje_pagado ?? 0;
    const cuotasPagadas = r?.cuotas_pagadas ?? 0;
    const mesesProyecto = r?.meses_proyecto ?? s.meses_a_pagar ?? 0;
    const cuotaMensual = r?.detalle_cuota?.valor_mensual_final ?? 0;
    const estadoProyecto = s.proyectoAsociado?.estado_proyecto;

    // Color semántico del estado
    const statusColor = hasOverdue
        ? "error"
        : isStandby
            ? "warning"
            : "success";

    const statusLabel = hasOverdue
        ? `${r!.cuotas_vencidas} cuota${r!.cuotas_vencidas > 1 ? "s" : ""} vencida${r!.cuotas_vencidas > 1 ? "s" : ""}`
        : isStandby
            ? `Pausado hasta ${formatDate(s.standby_end_date)}`
            : "Al día";

    const progressColor = hasOverdue
        ? "error"
        : porcentaje >= 100
            ? "success"
            : "primary";

    return (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid`,
                borderColor: hasOverdue
                    ? alpha(theme.palette.error.main, 0.3)
                    : theme.palette.divider,
                borderRadius: 3,
                overflow: "hidden",
                transition: "box-shadow 0.2s",
                "&:hover": {
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
            }}
        >
            {/* ── HEADER ── */}
            <Box
                sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    flexWrap="wrap"
                    gap={1}
                >
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            color="primary.main"
                            lineHeight={1.3}
                        >
                            {s.proyectoAsociado?.nombre_proyecto ?? "—"}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                        >
                            Suscripción #{s.id} · Alta: {formatDate(s.createdAt)}
                        </Typography>
                    </Box>

                    {/* Chips de estado */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {estadoProyecto && (
                            <Chip
                                label={estadoProyecto}
                                size="small"
                                variant="outlined"
                                sx={{
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    height: 22,
                                    borderColor: alpha(theme.palette.text.secondary, 0.3),
                                    color: "text.secondary",
                                }}
                            />
                        )}
                        <Chip
                            icon={
                                hasOverdue ? (
                                    <Cancel sx={{ fontSize: "13px !important" }} />
                                ) : isStandby ? (
                                    <PauseCircleOutline
                                        sx={{ fontSize: "13px !important" }}
                                    />
                                ) : (
                                    <CheckCircle sx={{ fontSize: "13px !important" }} />
                                )
                            }
                            label={statusLabel}
                            color={statusColor}
                            size="small"
                            variant={hasOverdue ? "filled" : "outlined"}
                            sx={{ fontSize: "0.68rem", fontWeight: 700, height: 22 }}
                        />
                    </Stack>
                </Stack>
            </Box>

            {/* ── PROGRESO ── */}
            <Box sx={{ px: 2.5, py: 1.5 }}>
                {isLoadingResumenes ? (
                    <Skeleton variant="rounded" height={32} sx={{ borderRadius: 2 }} />
                ) : r ? (
                    <>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={0.75}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                color="text.secondary"
                                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                            >
                                Avance del plan
                            </Typography>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                    {cuotasPagadas} de {mesesProyecto} cuotas
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={900}
                                    color={progressColor === "error" ? "error.main" : "primary.main"}
                                >
                                    {porcentaje.toFixed(1)}%
                                </Typography>
                            </Stack>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(porcentaje, 100)}
                            color={progressColor}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </>
                ) : (
                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontStyle: "italic" }}
                    >
                        Resumen de cuenta no disponible aún
                    </Typography>
                )}
            </Box>

            <Divider />

            {/* ── MÉTRICAS ── */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                divider={
                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ display: { xs: "none", sm: "block" } }}
                    />
                }
                sx={{ px: 0 }}
            >
                {/* Cuota mensual */}
                <MetricCell
                    icon={<ReceiptLong fontSize="small" />}
                    label="Cuota mensual"
                    value={
                        isLoadingResumenes ? (
                            <Skeleton width={80} height={24} />
                        ) : cuotaMensual > 0 ? (
                            formatCurrency(cuotaMensual)
                        ) : (
                            "—"
                        )
                    }
                    valueColor="primary.main"
                    tooltip="Importe mensual vigente según el valor actual del insumo"
                />

                {/* Capital ahorrado */}
                <MetricCell
                    icon={<AccountBalanceWallet fontSize="small" />}
                    label="Capital ahorrado"
                    value={formatCurrency(Number(s.monto_total_pagado || 0))}
                    valueColor={
                        Number(s.monto_total_pagado) > 0
                            ? "success.main"
                            : "text.disabled"
                    }
                    tooltip="Monto total abonado en cuotas del plan"
                />

                {/* Tokens */}
                <MetricCell
                    icon={<TokenIcon fontSize="small" />}
                    label="Tokens disponibles"
                    value={
                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                        >
                            <TokenIcon
                                sx={{ fontSize: 15, color: "warning.main" }}
                            />
                            <Typography
                                variant="body2"
                                fontWeight={800}
                                color="warning.main"
                            >
                                {s.tokens_disponibles ?? 0}
                            </Typography>
                        </Stack>
                    }
                    tooltip="Tokens para participar en adjudicaciones"
                />
            </Stack>

            <Divider />

            {/* ── ACCIONES ── */}
            <Stack
                direction="row"
                justifyContent="flex-end"
                spacing={1}
                sx={{ px: 2, py: 1.25 }}
            >
                <Button
                    size="small"
                    variant="text"
                    startIcon={<Visibility fontSize="small" />}
                    onClick={onViewProject}
                    sx={{
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        color: "text.secondary",
                        "&:hover": {
                            bgcolor: alpha(theme.palette.text.secondary, 0.06),
                        },
                    }}
                >
                    Ver proyecto
                </Button>

                {r && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<TrendingUp fontSize="small" />}
                        onClick={onViewAnalysis}
                        color="primary"
                        sx={{
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            borderColor: alpha(theme.palette.primary.main, 0.4),
                        }}
                    >
                        Análisis financiero
                    </Button>
                )}

                <Tooltip title="Solicitar baja del plan">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={onCancel}
                        sx={{ ml: 0.5 }}
                    >
                        <Cancel fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};

// ── Celda de métrica reutilizable ──────────────────────────────────────────
interface MetricCellProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    valueColor?: string;
    tooltip?: string;
}

const MetricCell: React.FC<MetricCellProps> = ({
    icon,
    label,
    value,
    tooltip,
}) => {
    const theme = useTheme();
    const cell = (
        <Box
            sx={{
                flex: 1,
                px: 2.5,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    color: "text.disabled",
                    flexShrink: 0,
                    display: "flex",
                }}
            >
                {icon}
            </Box>
            <Box minWidth={0}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        display: "block",
                        lineHeight: 1.3,
                        mb: 0.25,
                    }}
                >
                    {label}
                </Typography>
                {typeof value === "string" || typeof value === "number" ? (
                    <Typography variant="body2" fontWeight={800}>
                        {value}
                    </Typography>
                ) : (
                    value
                )}
            </Box>
        </Box>
    );

    return tooltip ? <Tooltip title={tooltip}>{cell}</Tooltip> : cell;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const MisSuscripciones: React.FC = () => {
    const snackbar = useContext(SnackbarContext);
    const navigate = useNavigate();
    const theme = useTheme();
    const formatCurrency = useCurrencyFormatter();
    const confirmDialog = useConfirmDialog();

    const twoFaModal = useModal();
    const [selectedCancelId, setSelectedCancelId] = useState<number | null>(null);
    const [cancelType, setCancelType] = useState<
        "subscription" | "adhesion" | null
    >(null);
    const [twoFAError, setTwoFAError] = useState<string | null>(null);
    const [motivoBaja, setMotivoBaja] = useState<string>("");
    const [selectedResumen, setSelectedResumen] =
        useState<ResumenCuentaDto | null>(null);

    const {
        suscripciones,
        canceladas,
        adhesiones,
        resumenes,
        stats,
        isLoading,
        error,
        cancelarSuscripcion,
        isCancelling,
        iniciarCancelSuscripcion,
        isInitiatingCancelSuscription,
        confirmarCancelSuscripcion,
        isConfirmingCancelSuscripcion,
        iniciarCancelAdhesion,
        isInitiatingCancel,
        confirmarCancelAdhesion,
        isConfirmingCancel,
        highlightedId,
    } = useSuscripciones();

    const [tabValue, setTabValue] = useState(0);

    // ── DATOS DERIVADOS ───────────────────────────────────────────────────────

    const resumenBySuscripcionId = useMemo(
        () => new Map(resumenes.map((r) => [r.id_suscripcion, r])),
        [resumenes],
    );

    const suscripcionesVigentes = useMemo(
        () => suscripciones.filter((s) => s.adhesion_completada === true),
        [suscripciones],
    );

    const capitalHistoricoTotal = useMemo(() => {
        const enActivas = suscripciones.reduce(
            (acc, s) => acc + Number(s.monto_total_pagado || 0),
            0,
        );
        const enCanceladas = canceladas.reduce(
            (acc, s) => acc + Number(s.monto_pagado_total || 0),
            0,
        );
        return enActivas + enCanceladas;
    }, [suscripciones, canceladas]);

    const totalTokens = useMemo(
        () =>
            suscripciones.reduce(
                (acc, s) => acc + (s.tokens_disponibles || 0),
                0,
            ),
        [suscripciones],
    );

    // Suma de cuotas mensuales de todos los planes activos
    const cuotaMensualTotal = useMemo(
        () =>
            resumenes.reduce(
                (acc, r) =>
                    acc + Number(r.detalle_cuota?.valor_mensual_final || 0),
                0,
            ),
        [resumenes],
    );

    // ── CONFIRMACIÓN (FLUJO SEGURO) ──────────────────────────────────────────

    const handleConfirmCancel = useCallback(
        (inputValue?: string) => {
            if (!confirmDialog.data) return;

            if (confirmDialog.action === "cancel_subscription") {
                const suscripcionId = (confirmDialog.data as SuscripcionDto).id;
                iniciarCancelSuscripcion(
                    { id: suscripcionId, motivo: inputValue ?? "" },
                    {
                        onSuccess: (res) => {
                            confirmDialog.close();
                            if (
                                res.status === 202 ||
                                res.data?.requires2FA
                            ) {
                                setSelectedCancelId(suscripcionId);
                                setCancelType("subscription");
                                setMotivoBaja(inputValue ?? "");
                                setTwoFAError(null);
                                twoFaModal.open();
                            } else {
                                // 👇 ACCIÓN DIRECTA EXITOSA
                                snackbar?.showSuccess("El motivo de baja se envió correctamente.");
                                setTimeout(() => window.location.reload(), 2550);
                            }
                        },
                        onError: () => confirmDialog.close(),
                    },
                );
            } else if (confirmDialog.action === ("cancel_adhesion" as any)) {
                const adhesionId = (confirmDialog.data as AdhesionDto).id;
                iniciarCancelAdhesion(adhesionId, {
                    onSuccess: (res) => {
                        confirmDialog.close();
                        if (
                            res.status === 202 ||
                            res.data?.is2FARequired ||
                            res.data?.requiere2FA
                        ) {
                            setSelectedCancelId(adhesionId);
                            setCancelType("adhesion");
                            setTwoFAError(null);
                            twoFaModal.open();
                        }
                    },
                    onError: () => confirmDialog.close(),
                });
            }
        },
        [confirmDialog, iniciarCancelSuscripcion, iniciarCancelAdhesion, twoFaModal],
    );

    // ── COLUMNAS: ADHESIONES ──────────────────────────────────────────────────

    const adhesionCols = useMemo<DataTableColumn<AdhesionDto>[]>(
        () => [
            {
                id: "proyecto_adhesion",
                label: "Detalle Adhesión",
                minWidth: 260,
                render: (row) => (
                    <Box>
                        <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            color="primary.main"
                        >
                            {row.proyecto?.nombre_proyecto ?? `Adhesión #${row.id}`}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                        >
                            Suscripción reservada #{row.id_suscripcion}
                        </Typography>
                        <Chip
                            label={getPlanLabel(row.plan_pago)}
                            size="small"
                            variant="outlined"
                            sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 600,
                            }}
                        />
                    </Box>
                ),
            },
            {
                id: "estado",
                label: "Estado",
                render: (row) => {
                    const isComplete = row.estado === "completada";
                    const isCancelled = row.estado === "cancelada";
                    return (
                        <Chip
                            label={row.estado.replace("_", " ").toUpperCase()}
                            size="small"
                            color={
                                isComplete
                                    ? "success"
                                    : isCancelled
                                        ? "default"
                                        : "warning"
                            }
                            icon={
                                isComplete ? (
                                    <CheckCircle />
                                ) : isCancelled ? (
                                    <Cancel />
                                ) : (
                                    <Schedule />
                                )
                            }
                            variant={isCancelled ? "outlined" : "filled"}
                            sx={{ fontWeight: 700 }}
                        />
                    );
                },
            },
            {
                id: "progreso",
                label: "Progreso",
                render: (row) => {
                    const esPagoContado = row.plan_pago === "contado";
                    return (
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color="text.secondary"
                        >
                            {esPagoContado
                                ? row.cuotas_pagadas === row.cuotas_totales
                                    ? "Pago único abonado"
                                    : "Pago único pendiente"
                                : `${row.cuotas_pagadas} de ${row.cuotas_totales} cuotas abonadas`}
                        </Typography>
                    );
                },
            },
            {
                id: "monto",
                label: "Monto Total",
                render: (row) => (
                    <Typography variant="body2" fontWeight={800}>
                        {formatCurrency(row.monto_total_adhesion)}
                    </Typography>
                ),
            },
            {
                id: "acciones",
                label: "Gestión",
                align: "right",
                render: (row) => {
                    const canCancel =
                        row.estado !== "completada" &&
                        row.estado !== "cancelada";
                    if (!canCancel) return null;
                    return (
                        <Tooltip title="Dar de baja esta adhesión">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                    confirmDialog.confirm(
                                        "cancel_adhesion" as any,
                                        row,
                                    )
                                }
                            >
                                <Cancel fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    );
                },
            },
        ],
        [confirmDialog, formatCurrency],
    );

    // ── COLUMNAS: HISTORIAL DE BAJAS ──────────────────────────────────────────

    const canceledCols = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(
        () => [
            {
                id: "proyecto",
                label: "Proyecto / Suscripción",
                minWidth: 320,
                render: (row) => (
                    <Box>
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="text.secondary"
                        >
                            {row.proyectoCancelado?.nombre_proyecto ??
                                "Proyecto finalizado"}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.disabled"
                            fontWeight={600}
                            sx={{ display: "block", mt: 0.5 }}
                        >
                            Suscripción orig. #{row.id_suscripcion_original}
                        </Typography>
                    </Box>
                ),
            },
            {
                id: "monto",
                label: "Monto en Liquidación",
                render: (row) => (
                    <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.disabled"
                    >
                        {formatCurrency(Number(row.monto_pagado_total || 0))}
                    </Typography>
                ),
            },
            {
                id: "fecha",
                label: "Fecha de Egreso",
                render: (row) => (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CalendarMonth
                            sx={{ fontSize: 16, color: "text.disabled" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(row.fecha_cancelacion)}
                        </Typography>
                    </Stack>
                ),
            },
            {
                id: "devolucion",
                label: "Devolución",
                align: "center",
                render: (row) =>
                    row.devolucion_realizada ? (
                        <Tooltip
                            title={
                                row.fecha_devolucion
                                    ? `Reintegrado el ${formatDate(row.fecha_devolucion)}`
                                    : "Reintegrado"
                            }
                        >
                            <CheckCircle color="success" />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Reintegro pendiente">
                            <Cancel color="error" />
                        </Tooltip>
                    ),
            },
        ],
        [formatCurrency],
    );

    // ── TEXTOS DEL DIALOG ─────────────────────────────────────────────────────

    const dialogTitle =
        confirmDialog.action === ("cancel_adhesion" as any)
            ? "¿Confirmas la baja de la adhesión?"
            : "¿Confirmas la baja del plan?";

    const dialogDescription = (() => {
        if (!confirmDialog.data) return "Esta acción es irreversible.";
        if (confirmDialog.action === ("cancel_adhesion" as any)) {
            const adhesion = confirmDialog.data as AdhesionDto;
            return `Estás a punto de cancelar tu Adhesión #${adhesion.id} del proyecto "${adhesion.proyecto?.nombre_proyecto}". Perderás el cupo reservado. Esta acción es irreversible.`;
        } else {
            const suscripcion = confirmDialog.data as SuscripcionDto;
            return `Estás a punto de cancelar la Suscripción #${suscripcion.id} correspondiente al proyecto "${suscripcion.proyectoAsociado?.nombre_proyecto}". Tu capital acumulado pasará a proceso de liquidación.`;
        }
    })();

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Planes de Ahorro"
                subtitle="Administra tu capital acumulado y tus tokens de participación."
            />

            {/* ESTADÍSTICAS */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                    },
                    gap: 2,
                    mb: 4,
                }}
            >
                <StatCard
                    title="Planes Activos"
                    value={suscripcionesVigentes.length.toString()}
                    icon={<PlayCircleFilled />}
                    color="success"
                    loading={isLoading}
                />
                <StatCard
                    title="Poder de Oferta"
                    value={`${totalTokens} Tokens`}
                    icon={<TokenIcon />}
                    color="warning"
                    loading={isLoading}
                />
                <StatCard
                    title="Capital Total"
                    value={formatCurrency(capitalHistoricoTotal)}
                    icon={<MonetizationOn />}
                    color="primary"
                    loading={isLoading}
                    subtitle="Acumulado histórico"
                />
                {/* Cuota mensual total — reemplaza "Bajas" que va en la pestaña */}
                <StatCard
                    title="Cuota Mensual"
                    value={
                        cuotaMensualTotal > 0
                            ? formatCurrency(cuotaMensualTotal)
                            : "—"
                    }
                    icon={<TrendingUp />}
                    color="info"
                    loading={isLoading}
                    subtitle={
                        suscripcionesVigentes.length > 1
                            ? `${suscripcionesVigentes.length} planes activos`
                            : "Importe vigente"
                    }
                />
            </Box>

            {/* PESTAÑAS */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label={`Planes Vigentes${suscripcionesVigentes.length > 0 ? ` (${suscripcionesVigentes.length})` : ""}`}
                        icon={<CheckCircle />}
                        iconPosition="start"
                        sx={{ fontWeight: 700 }}
                    />
                    <Tab
                        label="Adhesiones"
                        icon={<ReceiptLong />}
                        iconPosition="start"
                        sx={{ fontWeight: 700 }}
                    />
                    <Tab
                        label={`Historial de Salidas${canceladas.length > 0 ? ` (${canceladas.length})` : ""}`}
                        icon={<HistoryIcon />}
                        iconPosition="start"
                        sx={{ fontWeight: 700 }}
                    />
                </Tabs>
            </Box>

            {/* CONTENIDO POR PESTAÑA */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                {/* ── Tab 0: Planes Vigentes (Cards) ── */}
                {tabValue === 0 && (
                    <>
                        {suscripcionesVigentes.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    p: 6,
                                    textAlign: "center",
                                }}
                            >
                                <PlayCircleFilled
                                    sx={{
                                        fontSize: 48,
                                        color: alpha(
                                            theme.palette.text.disabled,
                                            0.4,
                                        ),
                                        mb: 2,
                                    }}
                                />
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    fontWeight={600}
                                >
                                    No tenés planes vigentes.
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    mt={0.5}
                                >
                                    Si tenés una adhesión en curso, debés
                                    completarla primero.
                                </Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={2}>
                                {suscripcionesVigentes.map((s) => (
                                    <PlanVigenteCard
                                        key={s.id}
                                        suscripcion={s}
                                        resumen={resumenBySuscripcionId.get(s.id)}
                                        formatCurrency={formatCurrency}
                                        isLoadingResumenes={isLoading}
                                        onViewProject={() =>
                                            navigate(
                                                `/proyectos/${s.id_proyecto}`,
                                            )
                                        }
                                        onViewAnalysis={() => {
                                            const r =
                                                resumenBySuscripcionId.get(s.id);
                                            if (r) setSelectedResumen(r);
                                        }}
                                        onCancel={() =>
                                            confirmDialog.confirm(
                                                "cancel_subscription",
                                                s,
                                            )
                                        }
                                    />
                                ))}
                            </Stack>
                        )}
                    </>
                )}

                {/* ── Tab 1: Adhesiones (tabla existente) ── */}
                {tabValue === 1 && (
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <DataTable
                            columns={adhesionCols}
                            data={adhesiones}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No tenés adhesiones registradas."
                        />
                    </Paper>
                )}

                {/* ── Tab 2: Historial (tabla existente) ── */}
                {tabValue === 2 && (
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <DataTable
                            columns={canceledCols}
                            data={canceladas}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No hay registros en el historial de bajas."
                        />
                    </Paper>
                )}
            </QueryHandler>

            {/* MODALES */}
            <DetalleCuotaModal
                open={selectedResumen !== null}
                onClose={() => setSelectedResumen(null)}
                resumen={selectedResumen}
            />

            <ConfirmDialog
                controller={confirmDialog}
                onConfirm={handleConfirmCancel}
                isLoading={
                    isCancelling ||
                    isInitiatingCancelSuscription ||
                    isInitiatingCancel
                }
                title={dialogTitle}
                description={dialogDescription}
            />

            <TwoFactorAuthModal
                open={twoFaModal.isOpen}
                onClose={() => {
                    twoFaModal.close();
                    setSelectedCancelId(null);
                    setCancelType(null);
                    setMotivoBaja("");
                    setTwoFAError(null);
                }}
                onSubmit={(code) => {
                    if (cancelType === "subscription") {
                        confirmarCancelSuscripcion(
                            {
                                suscripcionId: selectedCancelId!,
                                codigo_2fa: code,
                            },
                            {
                                onSuccess: () => {
                                    twoFaModal.close();
                                    setSelectedCancelId(null);
                                    setCancelType(null);
                                    snackbar?.showSuccess("El motivo de baja se envió correctamente.");
                                    setTimeout(() => window.location.reload(), 2550);
                                },
                                onError: (err: any) => {
                                    setTwoFAError(
                                        err.response?.data?.message ||
                                        "Código de seguridad inválido",
                                    );
                                },
                            },
                        );
                    } else if (cancelType === "adhesion") {
                        confirmarCancelAdhesion(
                            {
                                adhesionId: selectedCancelId!,
                                codigo_2fa: code,
                            },
                            {
                                onSuccess: () => {
                                    twoFaModal.close();
                                    setSelectedCancelId(null);
                                    setCancelType(null);
                                    setTimeout(
                                        () => window.location.reload(),
                                        2550,
                                    );
                                },
                                onError: (err: any) => {
                                    setTwoFAError(
                                        err.response?.data?.message ||
                                        "Código de seguridad inválido",
                                    );
                                },
                            },
                        );
                    }
                }}
                isLoading={isConfirmingCancelSuscripcion || isConfirmingCancel}
                error={twoFAError}
                title={
                    cancelType === "subscription"
                        ? "Confirmar Baja de Suscripción"
                        : "Confirmar Baja de Adhesión"
                }
                description={
                    cancelType === "subscription"
                        ? "Ingresá el código de 6 dígitos de tu autenticador para confirmar la cancelación del plan."
                        : "Ingresá el código de 6 dígitos de tu autenticador para confirmar la baja de la adhesión."
                }
            />
        </PageContainer>
    );
};

export default MisSuscripciones;