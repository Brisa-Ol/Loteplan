// src/features/admin/pages/Audit/modal/ModalDetalleAuditLog.tsx

import {
    Close,
    Computer,
    DevicesOther,
    InfoOutlined,
    Person,
    Schedule,
    Wifi,
} from "@mui/icons-material";
import {
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useMemo, useState } from "react";

import type { AuditLog } from "@/core/types/auditLog.dto";

// ============================================================================
// HELPERS (NUEVO RENDERIZADOR DE VALORES)
// ============================================================================

/** Componente para renderizar de forma limpia los valores individuales */
const ValueDisplay: React.FC<{ 
    val: any; 
    type: "old" | "new" | "unchanged"; 
    isChanged: boolean;
}> = ({ val, type, isChanged }) => {
    const theme = useTheme();

    // Si la llave no existía en ese estado
    if (val === undefined) {
        return (
            <Typography variant="caption" color="text.disabled" fontStyle="italic">
                —
            </Typography>
        );
    }

    let content;
    if (val === null) {
        content = <Typography variant="body2" fontStyle="italic">null</Typography>;
    } else if (typeof val === "boolean") {
        content = (
            <Chip
                label={val ? "true" : "false"}
                size="small"
                color={val ? "success" : "default"}
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
            />
        );
    } else if (typeof val === "object") {
        content = (
            <Typography variant="caption" fontFamily="monospace" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify(val)}
            </Typography>
        );
    } else {
        content = (
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                {String(val)}
            </Typography>
        );
    }

    // Lógica de colores solo si el valor cambió
    const getStyles = () => {
        if (!isChanged) return { bgcolor: 'transparent', color: 'text.primary' };
        if (type === "old") {
            return { 
                bgcolor: alpha(theme.palette.error.main, 0.08), 
                color: theme.palette.error.dark,
                textDecoration: "line-through" 
            };
        }
        if (type === "new") {
            return { 
                bgcolor: alpha(theme.palette.success.main, 0.12), 
                color: theme.palette.success.dark,
                fontWeight: 600
            };
        }
        return { bgcolor: 'transparent', color: 'text.primary' };
    };

    const styles = getStyles();

    return (
        <Box
            sx={{
                display: "inline-block",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: styles.bgcolor,
                color: styles.color,
                textDecoration: styles.textDecoration || "none",
            }}
        >
            {content}
        </Box>
    );
};

// ============================================================================
// PROPS
// ============================================================================

interface ModalDetalleAuditLogProps {
    open: boolean;
    log: AuditLog | null;
    onClose: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const ModalDetalleAuditLog: React.FC<ModalDetalleAuditLogProps> = ({
    open,
    log,
    onClose,
}) => {
    const theme = useTheme();
    const [tab, setTab] = useState(0);

    // Unificamos las llaves de ambos objetos para crear la tabla
    const diffKeys = useMemo(() => {
        if (!log) return [];
        const prev = log.datos_previos || {};
        const curr = log.datos_nuevos || {};
        // Set elimina duplicados, luego ordenamos alfabéticamente
        return Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)])).sort();
    }, [log]);

    if (!log) return null;

    const parseUserAgent = (ua: string) => {
        const isMobile = /mobile/i.test(ua);
        const isChrome = /chrome/i.test(ua);
        const isFirefox = /firefox/i.test(ua);
        const isSafari = /safari/i.test(ua) && !isChrome;
        const isWindows = /windows/i.test(ua);
        const isMac = /macintosh|mac os/i.test(ua);
        const isLinux = /linux/i.test(ua);

        const browser = isChrome ? "Chrome" : isFirefox ? "Firefox" : isSafari ? "Safari" : "Desconocido";
        const os = isWindows ? "Windows" : isMac ? "macOS" : isLinux ? "Linux" : "Desconocido";

        return { browser, os, isMobile, raw: ua };
    };

    const ua = log.user_agent ? parseUserAgent(log.user_agent) : null;
    const hasData = diffKeys.length > 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundImage: "none",
                },
            }}
        >
            {/* ---- HEADER ---- */}
            <DialogTitle sx={{ p: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
                    <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography variant="h6" fontWeight={800}>
                                Detalle del Log
                            </Typography>
                            <Chip
                                label={`#${log.id}`}
                                size="small"
                                sx={{ fontWeight: 700, fontFamily: "monospace" }}
                            />
                        </Stack>
                        <Chip
                            label={log.accion.replace(/_/g, " ")}
                            size="small"
                            sx={{
                                alignSelf: "flex-start",
                                fontWeight: 700,
                                fontSize: "0.72rem",
                                bgcolor: alpha(theme.palette.warning.main, 0.12),
                                color: "warning.dark",
                                border: "1px solid",
                                borderColor: alpha(theme.palette.warning.main, 0.3),
                            }}
                        />
                    </Stack>
                    <IconButton onClick={onClose} size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                        <Close fontSize="small" />
                    </IconButton>
                </Stack>

                {/* Metadatos rápidos */}
                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ px: 3, pb: 2, gap: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                            Admin ID <strong style={{ color: theme.palette.text.primary }}>{log.usuario_id}</strong>
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Schedule sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                        <DevicesOther sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                            {log.entidad_tipo} <strong style={{ color: theme.palette.text.primary }}>#{log.entidad_id}</strong>
                        </Typography>
                    </Stack>
                </Stack>

                <Divider />

                {/* Tabs */}
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ px: 2, minHeight: 42 }}
                    TabIndicatorProps={{ style: { height: 3, borderRadius: 2 } }}
                >
                    <Tab label="Cambios" sx={{ fontWeight: 700, minHeight: 42, fontSize: "0.82rem" }} />
                    <Tab label="Contexto" sx={{ fontWeight: 700, minHeight: 42, fontSize: "0.82rem" }} />
                </Tabs>
                <Divider />
            </DialogTitle>

            {/* ---- CONTENIDO ---- */}
            <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
                {/* TAB 0 — CAMBIOS */}
                {tab === 0 && (
                    <Box sx={{ p: 3 }}>
                        {/* Motivo - Ahora más limpio y con icono */}
                        {log.motivo && (
                            <Stack
                                direction="row"
                                spacing={1.5}
                                sx={{
                                    mb: 3,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.info.light, 0.2),
                                    borderLeft: `4px solid ${theme.palette.info.main}`,
                                }}
                            >
                                <InfoOutlined color="info" />
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="info.main" display="block" mb={0.25}>
                                        MOTIVO DEL CAMBIO
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">{log.motivo}</Typography>
                                </Box>
                            </Stack>
                        )}

                        {/* Nueva Diff Table */}
                        {hasData ? (
                            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: alpha(theme.palette.secondary.light, 0.5) }}>
                                        <TableRow>
                                            <TableCell sx={{ width: '25%', fontWeight: 700, color: 'text.secondary', py: 1.5 }}>
                                                Campo Modificado
                                            </TableCell>
                                            <TableCell sx={{ width: '37.5%', fontWeight: 700, color: 'text.secondary', py: 1.5 }}>
                                                Estado Anterior
                                            </TableCell>
                                            <TableCell sx={{ width: '37.5%', fontWeight: 700, color: 'text.secondary', py: 1.5 }}>
                                                Estado Nuevo
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {diffKeys.map((key) => {
                                            const prevVal = log.datos_previos?.[key];
                                            const currVal = log.datos_nuevos?.[key];
                                            // Evaluamos si el valor cambió convirtiendo a JSON para evitar errores por referencias de memoria
                                            const isChanged = JSON.stringify(prevVal) !== JSON.stringify(currVal);

                                            return (
                                                <TableRow 
                                                    key={key} 
                                                    hover 
                                                    sx={{ 
                                                        '&:last-child td': { border: 0 },
                                                        bgcolor: isChanged ? 'transparent' : alpha(theme.palette.action.hover, 0.05) 
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600, fontFamily: "monospace", color: isChanged ? 'text.primary' : 'text.disabled' }}>
                                                        {key}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ValueDisplay val={prevVal} type="old" isChanged={isChanged} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <ValueDisplay val={currVal} type="new" isChanged={isChanged} />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.disabled" fontStyle="italic" textAlign="center" py={4}>
                                No hay datos registrados en este log.
                            </Typography>
                        )}
                    </Box>
                )}

                {/* TAB 1 — CONTEXTO */}
                {tab === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                            Información del cliente
                        </Typography>

                        {ua ? (
                            <Stack spacing={2}>
                                {/* Resumen visual */}
                                <Stack direction="row" spacing={2} flexWrap="wrap">
                                    <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 120 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Navegador
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {ua.browser}
                                        </Typography>
                                    </Paper>
                                    <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 120 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Sistema operativo
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {ua.os}
                                        </Typography>
                                    </Paper>
                                    <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 120 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Dispositivo
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Computer sx={{ fontSize: 16 }} />
                                            <Typography variant="body2" fontWeight={700}>
                                                {ua.isMobile ? "Mobile" : "Desktop"}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                </Stack>

                                {/* Raw UA */}
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), border: "1px solid", borderColor: "divider" }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                                        USER-AGENT COMPLETO
                                    </Typography>
                                    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                                        {ua.raw}
                                    </Typography>
                                </Paper>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                Sin información de cliente registrada
                            </Typography>
                        )}

                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                            IP de origen
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Wifi color="action" />
                            <Typography variant="body1" fontFamily="monospace" fontWeight={600}>
                                {log.ip_origen ?? "—"}
                            </Typography>
                        </Stack>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ModalDetalleAuditLog;