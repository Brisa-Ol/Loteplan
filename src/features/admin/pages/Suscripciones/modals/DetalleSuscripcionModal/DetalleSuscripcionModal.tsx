// src/features/admin/pages/Suscripciones/modals/DetalleSuscripcionModal.tsx

import SuscripcionService from '@/core/api/services/suscripcion.service';
import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { BaseModal } from '@/shared';
import { AccountBalance, AddCircleOutline, PauseCircleOutline, PlayCircleOutline } from '@mui/icons-material';
import { Alert, alpha, Box, Button, Chip, CircularProgress, Snackbar, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { AuditFooter } from './AdvancePaymentsControl';
import FinancialSummary from './FinancialSummary';
import IdentityCards from './IdentityCards';
import PendingPaymentsSection from './PendingPaymentsSection';
import { PujasSection } from './PujasSection';
import { TokenDevolutionSection } from './TokenDevolutionSection';

interface Props {
    open: boolean;
    onClose: () => void;
    suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<Props> = ({ open, onClose, suscripcion }) => {
    const queryClient = useQueryClient();
    const theme = useTheme();

    const [showAdvanceForm, setShowAdvanceForm] = useState(false);
    const [cantidadMeses, setCantidadMeses] = useState(3);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showPendingPayments, setShowPendingPayments] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [newMonto, setNewMonto] = useState(0);
    
    // 🆕 Estado para el modal de confirmación de Pausa/Reanudar
    const [confirmStandby, setConfirmStandby] = useState<'pause' | 'resume' | null>(null);

    const { data: pagosPendientes = [], isLoading: loadingPagos, refetch: refetchPagos } = useQuery({
        queryKey: ['pagosPendientes', suscripcion?.id],
        queryFn: async () => {
            if (!suscripcion) return [];
            const res = await PagoService.getPendingBySubscription(suscripcion.id);
            const data = res.data as any;
            return (Array.isArray(data) ? data : data?.pagos || data?.data || []) as PagoDto[];
        },
        enabled: open && !!suscripcion && showPendingPayments,
    });

    // --- MUTACIONES ---
    const generatePaymentsMutation = useMutation({
        mutationFn: async () => {
            if (!suscripcion) throw new Error('No hay suscripción seleccionada');
            return PagoService.generateAdvancePayments({ id_suscripcion: suscripcion.id, cantidad_meses: Math.max(1, cantidadMeses) });
        },
        onSuccess: () => {
            setFeedback({ type: 'success', message: 'Cuotas adelantadas generadas con éxito.' });
            setShowAdvanceForm(false);
            queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
            refetchPagos();
        },
        onError: (err: any) => setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al generar pagos'}` }),
    });

    const updateMontoMutation = useMutation({
        mutationFn: ({ pagoId, monto }: { pagoId: number; monto: number }) => PagoService.updatePaymentAmount(pagoId, { monto }),
        onSuccess: () => { setFeedback({ type: 'success', message: '✅ Valor de cuota actualizado.' }); setEditingPaymentId(null); refetchPagos(); },
        onError: (err: any) => setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al actualizar'}` }),
    });

    // 🆕 Mutación para Pausar/Reanudar
    const toggleStandbyMutation = useMutation({
        mutationFn: async (action: 'pause' | 'resume') => {
            if (!suscripcion) throw new Error('No hay suscripción seleccionada');
            if (action === 'pause') return SuscripcionService.activateStandby(suscripcion.id);
            return SuscripcionService.deactivateStandby(suscripcion.id);
        },
        onSuccess: (res: any) => {
            setFeedback({ type: 'success', message: res.data?.message || 'Estado actualizado correctamente.' });
            queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
            setConfirmStandby(null);
            onClose(); // Cerramos el modal principal para refrescar la data visualmente
        },
        onError: (err: any) => {
            setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al cambiar estado'}` });
            setConfirmStandby(null);
        },
    });

    // --- HANDLERS ---
    const handleClose = () => {
        setShowAdvanceForm(false);
        setShowPendingPayments(false);
        setFeedback(null);
        setEditingPaymentId(null);
        setConfirmStandby(null);
        setCantidadMeses(3);
        onClose();
    };

    const handleCloseFeedback = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setFeedback(null);
    };

    if (!suscripcion) return null;

    const fullName = `${suscripcion.usuario?.nombre || ''} ${suscripcion.usuario?.apellido || ''}`;

    // 🆕 Lógica de adelantos: NO se puede adelantar si está inactiva O en pausa (standby)
    const maxAdelantar = suscripcion.meses_a_pagar > 0 ? suscripcion.meses_a_pagar : 120;
    const puedeAdelantar = suscripcion.activo && !suscripcion.standby_active && maxAdelantar > 0;

    return (
        <>
            <BaseModal
                open={open} onClose={handleClose}
                title="Gestión del Plan de Ahorro" subtitle={`Titular: ${fullName}`}
                icon={<AccountBalance />} headerColor="primary" maxWidth="md"
                hideConfirmButton cancelText="Cerrar"
                headerExtra={
                    <Chip
                        // 🆕 Actualizamos la etiqueta para mostrar "EN PAUSA" si corresponde
                        label={!suscripcion.activo ? 'CONTRATO FINALIZADO' : (suscripcion.standby_active ? 'EN PAUSA' : 'CONTRATO ACTIVO')}
                        color={!suscripcion.activo ? 'default' : (suscripcion.standby_active ? 'warning' : 'success')}
                        sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }}
                    />
                }
            >
                <Stack spacing={3}>
                    {suscripcion.standby_active && (
                        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2, fontWeight: 700 }}>
                            Esta suscripción se encuentra pausada hasta el {new Date(suscripcion.standby_end_date!).toLocaleDateString('es-AR')}. No se generarán nuevas cuotas automáticas ni adelantos.
                        </Alert>
                    )}

                    <IdentityCards suscripcion={suscripcion} fullName={fullName} />
                    <FinancialSummary suscripcion={suscripcion} />

                    {/* 🆕 CONTROLES DE PAUSA/REANUDAR */}
                    {suscripcion.activo && (
                        <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={800}>Estado Operativo de Cuotas</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {suscripcion.standby_active 
                                            ? 'La generación mensual está detenida por solicitud del usuario o admin.'
                                            : 'Suscripción operando normalmente. Puedes pausarla por 6 meses.'}
                                    </Typography>
                                </Box>
                                <Button 
                                    variant="outlined" 
                                    color={suscripcion.standby_active ? 'info' : 'warning'}
                                    startIcon={suscripcion.standby_active ? <PlayCircleOutline /> : <PauseCircleOutline />}
                                    onClick={() => setConfirmStandby(suscripcion.standby_active ? 'resume' : 'pause')}
                                    sx={{ borderRadius: 6, fontWeight: 700 }}
                                >
                                    {suscripcion.standby_active ? 'Reanudar Generación' : 'Pausar Suscripción'}
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* ADELANTOS */}
                    {puedeAdelantar && (
                        <Box sx={{ p: 2.5, border: '1px dashed', borderColor: 'primary.main', borderRadius: 4 }}>
                            <Typography variant="caption" fontWeight={900} color="primary.main"
                                sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Generación de Adelantos Administrativos
                            </Typography>
                            {!showAdvanceForm ? (
                                <Button variant="contained" color="primary" startIcon={<AddCircleOutline />}
                                    onClick={() => setShowAdvanceForm(true)}
                                    sx={{ borderRadius: 8, fontWeight: 700, textTransform: 'none', px: 3, boxShadow: 'none' }}>
                                    Adelantar Próximas Cuotas
                                </Button>
                            ) : (
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField 
                                        type="number" 
                                        label="Cuotas" 
                                        size="small" 
                                        value={cantidadMeses}
                                        inputProps={{ min: 1, max: maxAdelantar }}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            if (value <= maxAdelantar) setCantidadMeses(value);
                                        }} 
                                        sx={{ width: 120 }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" onClick={() => generatePaymentsMutation.mutate()}
                                            disabled={generatePaymentsMutation.isPending || cantidadMeses < 1 || cantidadMeses > maxAdelantar}
                                            sx={{ borderRadius: 6, fontWeight: 700, boxShadow: 'none' }}>
                                            {generatePaymentsMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Generar'}
                                        </Button>
                                        <Button color="inherit" onClick={() => setShowAdvanceForm(false)} sx={{ borderRadius: 6, fontWeight: 700 }}>
                                            Cancelar
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}
                        </Box>
                    )}

                    <PendingPaymentsSection
                        show={showPendingPayments}
                        onToggle={() => setShowPendingPayments(p => !p)}
                        isLoading={loadingPagos}
                        pagos={pagosPendientes}
                        editingPaymentId={editingPaymentId}
                        newMonto={newMonto}
                        setNewMonto={setNewMonto}
                        setEditingPaymentId={setEditingPaymentId}
                        updateMontoMutation={updateMontoMutation}
                    />

                    <PujasSection idSuscripcion={suscripcion.id} />

                    {suscripcion.tokens_disponibles === 0 && (
                        <TokenDevolutionSection 
                            suscripcion={suscripcion}
                            onSuccess={() => setFeedback({ type: 'success', message: '✅ Token devuelto correctamente.' })}
                        />
                    )}

                    <AuditFooter createdAt={suscripcion.createdAt} updatedAt={suscripcion.updatedAt} />
                </Stack>
            </BaseModal>

            {/* 🆕 MODAL DE CONFIRMACIÓN PAUSA/REANUDAR */}
            <BaseModal
                open={confirmStandby !== null}
                onClose={() => setConfirmStandby(null)}
                title={confirmStandby === 'pause' ? 'Pausar Suscripción' : 'Reanudar Suscripción'}
                icon={confirmStandby === 'pause' ? <PauseCircleOutline /> : <PlayCircleOutline />}
                headerColor={confirmStandby === 'pause' ? 'warning' : 'info'}
                maxWidth="sm"
                confirmText={confirmStandby === 'pause' ? 'Sí, Pausar' : 'Sí, Reanudar'}
                confirmButtonColor={confirmStandby === 'pause' ? 'warning' : 'info'}
                onConfirm={() => toggleStandbyMutation.mutate(confirmStandby!)}
                isLoading={toggleStandbyMutation.isPending}
            >
                <Typography variant="body1" color="text.secondary">
                    {confirmStandby === 'pause' 
                        ? '¿Estás seguro de que deseas pausar esta suscripción? No se generarán nuevas cuotas durante los próximos 6 meses.'
                        : '¿Estás seguro de que deseas reanudar esta suscripción? Se volverán a generar cuotas mensualmente a partir del próximo ciclo.'}
                </Typography>
            </BaseModal>

            {/* NOTIFICACIÓN TIPO PUSH / TOAST */}
            <Snackbar
                open={!!feedback}
                autoHideDuration={4000}
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseFeedback} 
                    severity={feedback?.type || 'info'} 
                    variant="filled"
                    sx={{ width: '100%', color: '#fff', borderRadius: 2 }}
                >
                    {feedback?.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default DetalleSuscripcionModal;