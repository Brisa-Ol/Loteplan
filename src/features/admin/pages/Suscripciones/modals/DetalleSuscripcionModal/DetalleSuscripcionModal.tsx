// src/features/admin/pages/Suscripciones/modals/DetalleSuscripcionModal.tsx

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { BaseModal } from '@/shared';
import { AccountBalance } from '@mui/icons-material';
import { Alert, Chip, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { AdvancePaymentsControl, AuditFooter } from './AdvancePaymentsControl';
import FinancialSummary from './FinancialSummary';
import IdentityCards from './IdentityCards';
import PendingPaymentsSection from './PendingPaymentsSection';


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
            setFeedback({ type: 'success', message: '✅ Pagos adelantados generados con éxito.' });
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
        onClose();
    };

    if (!suscripcion) return null;

    const fullName = `${suscripcion.usuario?.nombre || ''} ${suscripcion.usuario?.apellido || ''}`;

    return (
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
                {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ borderRadius: 2 }}>{feedback.message}</Alert>}

                <IdentityCards suscripcion={suscripcion} fullName={fullName} />
                <FinancialSummary suscripcion={suscripcion} />

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

                {suscripcion.activo && (
                    <AdvancePaymentsControl
                        showForm={showAdvanceForm}
                        onShowForm={() => setShowAdvanceForm(true)}
                        onHideForm={() => setShowAdvanceForm(false)}
                        cantidadMeses={cantidadMeses}
                        setCantidadMeses={setCantidadMeses}
                        generateMutation={generatePaymentsMutation}
                    />
                )}

                <AuditFooter createdAt={suscripcion.createdAt} updatedAt={suscripcion.updatedAt} />
            </Stack>
        </BaseModal>
    );
};

export default DetalleSuscripcionModal;