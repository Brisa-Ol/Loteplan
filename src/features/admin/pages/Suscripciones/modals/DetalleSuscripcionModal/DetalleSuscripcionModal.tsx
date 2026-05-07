// src/features/admin/pages/Suscripciones/modals/DetalleSuscripcionModal.tsx

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { BaseModal } from '@/shared';
import { AccountBalance, AddCircleOutline } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Snackbar, Stack, TextField, Typography } from '@mui/material';
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

    const [showAdvanceForm, setShowAdvanceForm] = useState(false);
    const [cantidadMeses, setCantidadMeses] = useState(3);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showPendingPayments, setShowPendingPayments] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [newMonto, setNewMonto] = useState(0);

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

    const handleClose = () => {
        setShowAdvanceForm(false);
        setShowPendingPayments(false);
        setFeedback(null);
        setEditingPaymentId(null);
        setCantidadMeses(3);
        onClose();
    };

    const handleCloseFeedback = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setFeedback(null);
    };

    if (!suscripcion) return null;

    const fullName = `${suscripcion.usuario?.nombre || ''} ${suscripcion.usuario?.apellido || ''}`;

    // Lógica de adelantos usando meses_a_pagar
    const maxAdelantar = suscripcion.meses_a_pagar > 0 ? suscripcion.meses_a_pagar : 120;
    const puedeAdelantar = suscripcion.activo && maxAdelantar > 0;

    return (
        <>
            <BaseModal
                open={open} onClose={handleClose}
                title="Gestión del Plan de Ahorro" subtitle={`Titular: ${fullName}`}
                icon={<AccountBalance />} headerColor="primary" maxWidth="md"
                hideConfirmButton cancelText="Cerrar"
                headerExtra={
                    <Chip
                        label={suscripcion.activo ? 'CONTRATO ACTIVO' : 'CONTRATO FINALIZADO'}
                        color={suscripcion.activo ? 'success' : 'default'}
                        sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }}
                    />
                }
            >
                <Stack spacing={3}>
                    <IdentityCards suscripcion={suscripcion} fullName={fullName} />
                    <FinancialSummary suscripcion={suscripcion} />

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