// src/pages/Admin/Suscripciones/modals/DetalleSuscripcionModal.tsx

import React, { useState } from 'react';
import {
    AccountBalance,
    AddCircleOutline,
    AlternateEmail,
    CalendarToday,
    Check as CheckIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    ExpandLess,
    ExpandMore,
    Person,
    Receipt,
    Token as TokenIcon,
    Update as UpdateIcon
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

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/dto/pago.dto';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BaseModal } from '@/shared';

interface DetalleSuscripcionModalProps {
    open: boolean;
    onClose: () => void;
    suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<DetalleSuscripcionModalProps> = ({ open, onClose, suscripcion }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    // --- ESTADOS LOCALES ---
    const [showAdvanceForm, setShowAdvanceForm] = useState(false);
    const [cantidadMeses, setCantidadMeses] = useState<number>(3);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showPendingPayments, setShowPendingPayments] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [newMonto, setNewMonto] = useState<number>(0);

    // --- QUERIES ---
    const { data: pagosPendientes = [], isLoading: loadingPagos, refetch: refetchPagos } = useQuery({
        queryKey: ['pagosPendientes', suscripcion?.id],
        queryFn: async () => {
            if (!suscripcion) return [];
            const res = await PagoService.getPendingBySubscription(suscripcion.id);
            // Manejo flexible de la respuesta del backend
            const data = res.data as any;
            return Array.isArray(data) ? data : data?.pagos || data?.data || [];
        },
        enabled: open && !!suscripcion && showPendingPayments,
    });

    // --- MUTACIONES ---
    const generatePaymentsMutation = useMutation({
        mutationFn: async () => {
            if (!suscripcion) throw new Error('No hay suscripción seleccionada');
            return await PagoService.generateAdvancePayments({
                id_suscripcion: suscripcion.id,
                cantidad_meses: Math.max(1, cantidadMeses)
            });
        },
        onSuccess: () => {
            setFeedback({ type: 'success', message: '✅ Pagos adelantados generados con éxito.' });
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
            setFeedback({ type: 'success', message: '✅ Valor de cuota actualizado.' });
            setEditingPaymentId(null);
            refetchPagos();
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

    const fullName = `${suscripcion.usuario?.nombre || ''} ${suscripcion.usuario?.apellido || ''}`;

    return (
        <BaseModal
            open={open}
            onClose={handleClose}
            title="Gestión del Plan de Ahorro"
            subtitle={`Titular: ${fullName}`}
            icon={<AccountBalance />}
            headerColor="primary"
            maxWidth="md"
            hideConfirmButton
            cancelText="Cerrar"
            headerExtra={
                <Chip
                    label={suscripcion.activo ? 'CONTRATO ACTIVO' : 'CONTRATO FINALIZADO'}
                    color={suscripcion.activo ? 'success' : 'default'}
                    sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }}
                />
            }
        >
            <Stack spacing={3}>
                {feedback && (
                    <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ borderRadius: 2 }}>
                        {feedback.message}
                    </Alert>
                )}

                {/* 1. SECCIÓN: IDENTIDAD */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                            <Person color="primary" sx={{ fontSize: 18 }} />
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Inversor</Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight={800}>{fullName}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                            <AlternateEmail sx={{ fontSize: 14, color: 'text.disabled' }} />
                            <Typography variant="caption" color="primary.main" fontWeight={700}>@{suscripcion.usuario?.nombre_usuario}</Typography>
                        </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                            <AccountBalance color="secondary" sx={{ fontSize: 18 }} />
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Proyecto Asociado</Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight={800}>{suscripcion.proyectoAsociado?.nombre_proyecto}</Typography>
                        <Chip 
                            label={suscripcion.proyectoAsociado?.estado_proyecto?.toUpperCase()} 
                            size="small" 
                            color={suscripcion.proyectoAsociado?.estado_proyecto === 'En proceso' ? 'success' : 'warning'}
                            sx={{ mt: 1, height: 18, fontSize: '0.6rem', fontWeight: 900 }} 
                        />
                    </Paper>
                </Stack>

                {/* 2. SECCIÓN: RESUMEN FINANCIERO */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
                        <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block">TOTAL CAPITALIZADO</Typography>
                            <Typography variant="h4" fontWeight={900} color="info.main" sx={{ fontFamily: 'monospace' }}>
                                ${Number(suscripcion.monto_total_pagado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                        <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary" fontWeight={800} display="block">SALDO A FAVOR</Typography>
                            <Typography variant="h5" fontWeight={800} color={Number(suscripcion.saldo_a_favor) > 0 ? "success.main" : "text.disabled"} sx={{ fontFamily: 'monospace' }}>
                                ${Number(suscripcion.saldo_a_favor || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                        <Stack spacing={1} alignItems="center">
                            <Chip 
                                icon={<TokenIcon color="warning" sx={{ fontSize: '16px !important' }} />} 
                                label={`${suscripcion.tokens_disponibles} TOKENS`} 
                                color="warning" 
                                sx={{ fontWeight: 900, fontSize: '0.75rem' }} 
                            />
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                                {suscripcion.meses_a_pagar} CUOTAS RESTANTES
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>

                {/* 3. SECCIÓN: PAGOS PENDIENTES */}
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box
                        onClick={() => setShowPendingPayments(!showPendingPayments)}
                        sx={{ p: 2, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Receipt color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={900}>CRONOGRAMA DE CUOTAS PENDIENTES</Typography>
                        </Stack>
                        {showPendingPayments ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                    <Collapse in={showPendingPayments}>
                        <Divider />
                        <Box sx={{ p: 1 }}>
                            {loadingPagos ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
                            ) : pagosPendientes.length === 0 ? (
                                <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}>No hay cuotas pendientes de cobro.</Typography>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>MES</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>MONTO</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>ESTADO</TableCell>
                                            <TableCell align="right"></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pagosPendientes.map((pago: PagoDto) => (
                                            <TableRow key={pago.id} hover>
                                                <TableCell sx={{ fontWeight: 700 }}>#{pago.mes}</TableCell>
                                                <TableCell>
                                                    {editingPaymentId === pago.id ? (
                                                        <TextField
                                                            type="number" size="small" autoFocus value={newMonto}
                                                            onChange={(e) => setNewMonto(Number(e.target.value))}
                                                            sx={{ width: 110, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" fontWeight={600}>${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={pago.estado_pago} size="small" color={pago.estado_pago === 'vencido' ? 'error' : 'warning'} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {editingPaymentId === pago.id ? (
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            <IconButton size="small" color="success" onClick={() => updateMontoMutation.mutate({ pagoId: pago.id, monto: newMonto })}><CheckIcon fontSize="small" /></IconButton>
                                                            <IconButton size="small" color="error" onClick={() => setEditingPaymentId(null)}><CloseIcon fontSize="small" /></IconButton>
                                                        </Stack>
                                                    ) : (
                                                        <IconButton size="small" onClick={() => { setEditingPaymentId(pago.id); setNewMonto(Number(pago.monto)); }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
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

                {/* 4. SECCIÓN: ACCIONES DE CONTROL */}
                {suscripcion.activo && (
                    <Paper 
                        variant="outlined" 
                        sx={{ p: 2.5, border: '1px dashed', borderColor: 'primary.main', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}
                    >
                        <Typography variant="caption" fontWeight={900} color="primary.main" sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Panel de Control Administrativo</Typography>
                        {!showAdvanceForm ? (
                            <Button 
                                variant="contained" 
                                startIcon={<AddCircleOutline />} 
                                onClick={() => setShowAdvanceForm(true)}
                                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                            >
                                Adelantar Próximas Cuotas
                            </Button>
                        ) : (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                <TextField
                                    type="number" label="Cantidad de meses" size="small" value={cantidadMeses}
                                    onChange={(e) => setCantidadMeses(Number(e.target.value))} 
                                    sx={{ width: { xs: '100%', sm: 180 } }}
                                />
                                <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                    <Button variant="contained" onClick={() => generatePaymentsMutation.mutate()} disabled={generatePaymentsMutation.isPending}>Generar</Button>
                                    <Button color="inherit" onClick={() => setShowAdvanceForm(false)}>Cancelar</Button>
                                </Stack>
                            </Stack>
                        )}
                    </Paper>
                )}

                {/* 5. SECCIÓN: AUDITORÍA (FIXED TYPESCRIPT ERROR) */}
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={3} 
                    divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.5 }} />}
                    sx={{ px: 1 }}
                >
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarToday sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Box>
                            <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'block', lineHeight: 1 }}>REGISTRO DE ALTA</Typography>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                {suscripcion.createdAt 
                                    ? new Date(suscripcion.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
                                    : 'N/A'}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <UpdateIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Box>
                            <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'block', lineHeight: 1 }}>ÚLTIMA MODIFICACIÓN</Typography>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                {suscripcion.updatedAt 
                                    ? `${new Date(suscripcion.updatedAt).toLocaleDateString('es-AR')} ${new Date(suscripcion.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                                    : 'Sin modificaciones'}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </Stack>
        </BaseModal>
    );
};

export default DetalleSuscripcionModal;