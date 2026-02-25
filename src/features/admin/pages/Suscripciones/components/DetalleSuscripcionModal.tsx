// src/pages/Admin/Suscripciones/modals/DetalleSuscripcionModal.tsx

import {
    AccountBalance,
    AddCircleOutline,
    CalendarToday,
    Check as CheckIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    ExpandLess,
    ExpandMore,
    Person,
    Receipt,
    Token
} from '@mui/icons-material';
import {
    Alert,
    alpha,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    IconButton,
    Paper,
    Stack,
    Table, TableBody, TableCell, TableHead, TableRow,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import React, { useState } from 'react';

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/dto/pago.dto';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Props {
    open: boolean;
    onClose: () => void;
    suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<Props> = ({ open, onClose, suscripcion }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    // Estados Locales
    const [showAdvanceForm, setShowAdvanceForm] = useState(false);
    const [cantidadMeses, setCantidadMeses] = useState<number>(3);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showPendingPayments, setShowPendingPayments] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [newMonto, setNewMonto] = useState<number>(0);

    // --- Query de Pagos Pendientes ---
    const { data: pagosPendientes = [], isLoading: loadingPagos, refetch: refetchPagos } = useQuery({
        queryKey: ['pagosPendientes', suscripcion?.id],
        queryFn: async () => {
            if (!suscripcion) return [];
            const res = await PagoService.getPendingBySubscription(suscripcion.id);
            // Manejo robusto de la respuesta (array directo o envuelto)
            return Array.isArray(res.data) ? res.data : (res.data as any).pagos || (res.data as any).data || [];
        },
        enabled: open && !!suscripcion && showPendingPayments,
        initialData: []
    });

    // --- Mutaciones ---
    const generatePaymentsMutation = useMutation({
        mutationFn: async () => {
            if (!suscripcion) throw new Error('No hay suscripción seleccionada');
            return await PagoService.generateAdvancePayments({
                id_suscripcion: suscripcion.id,
                cantidad: cantidadMeses
            });
        },
        onSuccess: (res) => {
            setFeedback({ type: 'success', message: `✅ Se generaron los pagos adelantados correctamente.` });
            setShowAdvanceForm(false);
            queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
            refetchPagos();
        },
        onError: (err: any) => {
            setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al generar pagos'}` });
        }
    });

    const updateMontoMutation = useMutation({
        mutationFn: async ({ pagoId, monto }: { pagoId: number, monto: number }) => {
            return await PagoService.updatePaymentAmount(pagoId, { monto });
        },
        onSuccess: () => {
            setFeedback({ type: 'success', message: '✅ Monto actualizado correctamente.' });
            setEditingPaymentId(null);
            refetchPagos();
            queryClient.invalidateQueries({ queryKey: ['adminPagos'] });
        },
        onError: (err: any) => {
            setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al actualizar'}` });
        }
    });

    const handleClose = () => {
        setShowAdvanceForm(false);
        setShowPendingPayments(false);
        setFeedback(null);
        setEditingPaymentId(null);
        onClose();
    };

    if (!suscripcion) return null;

    return (
        <BaseModal
            open={open}
            onClose={handleClose}
            title="Detalle del Plan de Ahorro"
            subtitle={`Referencia: #SUS-${suscripcion.id}`}
            icon={<AccountBalance />}
            headerColor="primary"
            maxWidth="md"
            hideConfirmButton
            cancelText="Cerrar"
            headerExtra={
                <Chip
                    label={suscripcion.activo ? 'ACTIVA' : 'CANCELADA'}
                    color={suscripcion.activo ? 'success' : 'default'}
                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                />
            }
        >
            <Stack spacing={3}>
                {feedback && (
                    <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ borderRadius: 2 }}>
                        {feedback.message}
                    </Alert>
                )}

                {/* 1. Encabezado de Identidad */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Paper elevation={0} sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <Person color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={800}>TITULAR</Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight={700}>{suscripcion.usuario?.nombre} {suscripcion.usuario?.apellido}</Typography>
                        <Typography variant="caption" color="text.secondary">{suscripcion.usuario?.email}</Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <AccountBalance color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={800}>PROYECTO</Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight={700}>{suscripcion.proyectoAsociado?.nombre_proyecto || 'Cargando...'}</Typography>
                        <Chip label={suscripcion.proyectoAsociado?.estado_proyecto} size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                    </Paper>
                </Stack>

                {/* 2. Resumen Financiero Central (Mejorado con Saldo a Favor) */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>

                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>CAPITAL TOTAL RECAUDADO</Typography>
                            <Typography variant="h4" fontWeight={900} color="info.main" sx={{ fontFamily: 'monospace' }}>
                                ${Number(suscripcion.monto_total_pagado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>SALDO A FAVOR</Typography>
                            <Typography variant="h6" fontWeight={800} color={Number(suscripcion.saldo_a_favor) > 0 ? "success.main" : "text.primary"} sx={{ fontFamily: 'monospace' }}>
                                ${Number(suscripcion.saldo_a_favor || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                        <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                            <Chip icon={<Token color="warning" />} label={`${suscripcion.tokens_disponibles} TOKENS`} color="warning" sx={{ fontWeight: 800 }} />
                            <Typography variant="caption" fontWeight={600}>{suscripcion.meses_a_pagar} cuotas restantes</Typography>
                        </Stack>
                    </Stack>
                </Paper>

                {/* 3. Pagos Pendientes (Expandible) */}
                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <Box
                        onClick={() => setShowPendingPayments(!showPendingPayments)}
                        sx={{ p: 2, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Receipt color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={800}>CRONOGRAMA PENDIENTE</Typography>
                        </Stack>
                        {showPendingPayments ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                    <Collapse in={showPendingPayments}>
                        <Divider />
                        <Box sx={{ p: 2 }}>
                            {loadingPagos ? <CircularProgress size={20} sx={{ m: 2 }} /> : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Cuota</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Monto</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pagosPendientes.map((pago: PagoDto) => (
                                            <TableRow key={pago.id}>
                                                <TableCell>Mes #{pago.mes}</TableCell>
                                                <TableCell>
                                                    {editingPaymentId === pago.id ? (
                                                        <TextField
                                                            type="number" size="small" value={newMonto}
                                                            onChange={(e) => setNewMonto(Number(e.target.value))}
                                                            sx={{ width: 100 }}
                                                        />
                                                    ) : `$${Number(pago.monto).toLocaleString('es-AR')}`}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={pago.estado_pago.toUpperCase()} size="small" color={pago.estado_pago === 'vencido' ? 'error' : 'warning'} sx={{ fontSize: '0.6rem', fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {editingPaymentId === pago.id ? (
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            <IconButton size="small" color="success" onClick={() => updateMontoMutation.mutate({ pagoId: pago.id, monto: newMonto })}><CheckIcon fontSize="inherit" /></IconButton>
                                                            <IconButton size="small" onClick={() => setEditingPaymentId(null)}><CloseIcon fontSize="inherit" /></IconButton>
                                                        </Stack>
                                                    ) : (
                                                        <IconButton size="small" onClick={() => { setEditingPaymentId(pago.id); setNewMonto(Number(pago.monto)); }}><EditIcon fontSize="inherit" /></IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </Paper>

                {/* 4. Acciones de Administración */}
                {suscripcion.activo && (
                    <Box sx={{ p: 2, border: '1px dashed', borderColor: 'primary.main', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="subtitle2" fontWeight={800} mb={2}>ACCIONES DE CONTROL</Typography>
                        {!showAdvanceForm ? (
                            <Button variant="outlined" startIcon={<AddCircleOutline />} onClick={() => setShowAdvanceForm(true)}>Generar Pagos Adelantados</Button>
                        ) : (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    type="number" label="Meses a generar" size="small" value={cantidadMeses}
                                    onChange={(e) => setCantidadMeses(Number(e.target.value))} sx={{ width: 140 }}
                                />
                                <Button variant="contained" onClick={() => generatePaymentsMutation.mutate()} disabled={generatePaymentsMutation.isPending}>Confirmar</Button>
                                <Button color="inherit" onClick={() => setShowAdvanceForm(false)}>Cancelar</Button>
                            </Stack>
                        )}
                    </Box>
                )}

                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" px={1}>
                    <CalendarToday sx={{ fontSize: 14 }} />
                    <Typography variant="caption" fontWeight={600}>
                        Registrado el: {new Date(suscripcion.fecha_creacion || (suscripcion as any).createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Typography>
                </Stack>
            </Stack>
        </BaseModal>
    );
};

export default DetalleSuscripcionModal;