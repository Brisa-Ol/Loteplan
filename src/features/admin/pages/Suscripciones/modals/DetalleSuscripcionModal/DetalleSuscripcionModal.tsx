// src/features/admin/pages/Suscripciones/modals/DetalleSuscripcionModal.tsx

import SuscripcionService from '@/core/api/services/suscripcion.service';
import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { BaseModal } from '@/shared';
import { AccountBalance, AddCircleOutline, AttachMoney, Edit as EditIcon, PauseCircleOutline, PlayCircleOutline } from '@mui/icons-material';
import { Alert, alpha, Box, Button, Chip, CircularProgress, Snackbar, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { AuditFooter } from './AdvancePaymentsControl';
import FinancialSummary from './FinancialSummary';
import IdentityCards from './IdentityCards';
import { PujasSection } from './PujasSection';
import { TokenDevolutionSection } from './TokenDevolutionSection';
import { PendingPaymentsPanel } from './PendingPaymentsSection';

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
    const [confirmStandby, setConfirmStandby] = useState<'pause' | 'resume' | null>(null);

    // 🆕 Estados para modales de confirmación con motivo
    const [forcePaymentModalOpen, setForcePaymentModalOpen] = useState(false);
    const [selectedPagoToForce, setSelectedPagoToForce] = useState<PagoDto | null>(null);
    const [forceMotivo, setForceMotivo] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editMotivo, setEditMotivo] = useState('');

    // ─── QUERY ───────────────────────────────────────────────
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

    // ─── MUTACIONES ──────────────────────────────────────────
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
        mutationFn: ({ pagoId, monto, motivo_cambio }: { pagoId: number; monto: number; motivo_cambio: string }) =>
            PagoService.updatePaymentAmount(pagoId, { monto, motivo_cambio }),
        onSuccess: () => {
            setFeedback({ type: 'success', message: '✅ Valor de cuota actualizado.' });
            setEditingPaymentId(null);
            setEditModalOpen(false);
            setEditMotivo('');
            refetchPagos();
        },
        onError: (err: any) => setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al actualizar'}` }),
    });

    // 🆕 Forzar pago con motivo
    const forcePaymentMutation = useMutation({
        mutationFn: ({ pagoId, motivo }: { pagoId: number; motivo: string }) =>
            PagoService.updatePaymentStatus(pagoId, { estado_pago: 'forzado', motivo }),
        onSuccess: () => {
            setFeedback({ type: 'success', message: '✅ Pago forzado manualmente con éxito.' });
            setForcePaymentModalOpen(false);
            setSelectedPagoToForce(null);
            setForceMotivo('');
            refetchPagos();
            queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
        },
        onError: (err: any) => setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al forzar pago'}` }),
    });

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
            onClose();
        },
        onError: (err: any) => {
            setFeedback({ type: 'error', message: `❌ ${err.response?.data?.error || 'Error al cambiar estado'}` });
            setConfirmStandby(null);
        },
    });

    // ─── HANDLERS ────────────────────────────────────────────
    const handleClose = () => {
        setShowAdvanceForm(false);
        setShowPendingPayments(false);
        setFeedback(null);
        setEditingPaymentId(null);
        setConfirmStandby(null);
        setCantidadMeses(3);
        setForcePaymentModalOpen(false);
        setSelectedPagoToForce(null);
        setForceMotivo('');
        setEditModalOpen(false);
        setEditMotivo('');
        onClose();
    };

    const handleCloseFeedback = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setFeedback(null);
    };

    // 🆕 Abre el modal de forzar pago
    const handleOpenForceModal = (pago: PagoDto) => {
        setSelectedPagoToForce(pago);
        setForceMotivo('');
        setForcePaymentModalOpen(true);
    };

    // 🆕 Confirma el forzado
    const handleSubmitForce = () => {
        if (!selectedPagoToForce || !forceMotivo.trim()) return;
        forcePaymentMutation.mutate({ pagoId: selectedPagoToForce.id, motivo: forceMotivo });
    };

    // 🆕 Abre el modal de editar monto (solo abre — el monto ya está en estado)
    const handleOpenEditModal = () => {
        setEditMotivo('');
        setEditModalOpen(true);
    };

    // 🆕 Confirma la edición del monto
    const handleSubmitEditMonto = () => {
        if (editingPaymentId === null || !editMotivo.trim()) return;
        updateMontoMutation.mutate({ pagoId: editingPaymentId, monto: newMonto, motivo_cambio: editMotivo });
    };

    // ─── GUARD (siempre DESPUÉS de todos los hooks) ──────────
    if (!suscripcion) return null;

    const fullName = `${suscripcion.usuario?.nombre || ''} ${suscripcion.usuario?.apellido || ''}`;
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

                    {/* CONTROLES PAUSA/REANUDAR */}
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
                                        type="number" label="Cuotas" size="small" value={cantidadMeses}
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

                    {/* CUOTAS PENDIENTES */}
                    <PendingPaymentsPanel
                        show={showPendingPayments}
                        onToggle={() => setShowPendingPayments(p => !p)}
                        isLoading={loadingPagos}
                        pagos={pagosPendientes}
                        editingPaymentId={editingPaymentId}
                        newMonto={newMonto}
                        setNewMonto={setNewMonto}
                        setEditingPaymentId={setEditingPaymentId}
                        onForcePayment={handleOpenForceModal}
                        onSaveMontoClick={handleOpenEditModal}
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

            {/* MODAL PAUSA/REANUDAR */}
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

            {/* 🆕 MODAL FORZAR PAGO */}
            <BaseModal
                open={forcePaymentModalOpen}
                onClose={() => { setForcePaymentModalOpen(false); setForceMotivo(''); }}
                title="Forzar Pago Manual"
                icon={<AttachMoney />}
                headerColor="warning" maxWidth="sm"
                confirmText="Confirmar Cobro"
                confirmButtonColor="warning"
                onConfirm={handleSubmitForce}
                isLoading={forcePaymentMutation.isPending}
                disableConfirm={!forceMotivo.trim()}
            >
                <Box>
                    <Typography variant="body2" mb={3} color="text.secondary">
                        Cuota <b>#{selectedPagoToForce?.mes}</b> por{' '}
                        <b>${Number(selectedPagoToForce?.monto).toLocaleString('es-AR')}</b> pasará a estado <b>FORZADO</b>.
                    </Typography>
                    <TextField
                        autoFocus fullWidth multiline rows={3}
                        label="Motivo o Referencia (Obligatorio)"
                        value={forceMotivo}
                        onChange={(e) => setForceMotivo(e.target.value)}
                        placeholder="Ej: Pago recibido en efectivo en oficina central"
                        helperText="Indica el motivo por el cual estás forzando el pago."
                    />
                </Box>
            </BaseModal>

            {/* 🆕 MODAL EDITAR MONTO */}
            <BaseModal
                open={editModalOpen}
                onClose={() => { setEditModalOpen(false); setEditMotivo(''); }}
                title="Modificar Monto de Cuota"
                icon={<EditIcon />}
                headerColor="primary" maxWidth="sm"
                confirmText="Guardar Cambios"
                confirmButtonColor="primary"
                onConfirm={handleSubmitEditMonto}
                isLoading={updateMontoMutation.isPending}
                disableConfirm={!editMotivo.trim()}
            >
                <Box>
                    <Typography variant="body2" mb={3} color="text.secondary">
                        Estás a punto de modificar el monto de la cuota seleccionada a{' '}
                        <b>${Number(newMonto).toLocaleString('es-AR')}</b>.
                    </Typography>
                    <TextField
                        autoFocus fullWidth multiline rows={3}
                        label="Motivo de la modificación (Obligatorio)"
                        value={editMotivo}
                        onChange={(e) => setEditMotivo(e.target.value)}
                        placeholder="Ej: Ajuste manual por bonificación especial aprobada."
                        helperText="Indica el motivo por el cual estás cambiando el monto de esta cuota."
                    />
                </Box>
            </BaseModal>

            {/* TOAST */}
            <Snackbar
                open={!!feedback} autoHideDuration={4000}
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