import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, Stack, Paper, Divider, IconButton, Chip, LinearProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    AccountBalance,
    AccessTime,
    CheckCircle,
    ErrorOutline
} from '@mui/icons-material';
import type { ResumenCuentaDto } from '../../../../types/dto/resumenCuenta.dto';

interface DetalleResumenModalProps {
    open: boolean;
    onClose: () => void;
    resumen: ResumenCuentaDto | null;
}

const DetalleResumenModal: React.FC<DetalleResumenModalProps> = ({ open, onClose, resumen }) => {
    if (!resumen) return null;

    const isCompleted = resumen.porcentaje_pagado >= 100;
    const hasOverdue = resumen.cuotas_vencidas > 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            {/* --- HEADER DEL MODAL --- */}
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <AccountBalance color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Resumen de Cuenta #{resumen.id}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>

                    {/* 1. INFORMACIÓN PRINCIPAL DEL PROYECTO */}
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Proyecto Asociado</Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary.main">
                                    {resumen.nombre_proyecto}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Suscripción ID: <strong>{resumen.id_suscripcion}</strong>
                                </Typography>
                            </Box>
                            
                            <Chip
                                label={isCompleted ? 'Plan Completado' : hasOverdue ? 'Con Deuda Vencida' : 'Plan Activo'}
                                color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
                                icon={isCompleted ? <CheckCircle fontSize="small" /> : hasOverdue ? <ErrorOutline fontSize="small" /> : <AccessTime fontSize="small" />}
                                sx={{ fontWeight: 'bold', px: 1 }}
                            />
                        </Stack>
                    </Paper>

                    {/* 2. PROGRESO DE PAGOS */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Progreso del Plan de Pagos
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Stack spacing={3}>
                                {/* Barra de Progreso */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>{resumen.cuotas_pagadas}</strong> de <strong>{resumen.meses_proyecto}</strong> cuotas pagadas
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                                            {resumen.porcentaje_pagado.toFixed(2)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(resumen.porcentaje_pagado, 100)}
                                        sx={{ height: 10, borderRadius: 5 }}
                                        color={isCompleted ? 'success' : hasOverdue ? 'warning' : 'primary'}
                                    />
                                </Box>

                                {/* Tarjetas de Estado (Reemplazo de Grid) */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 2, 
                                    flexDirection: { xs: 'column', sm: 'row' } 
                                }}>
                                    <Paper variant="outlined" sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: 'success.50', borderColor: 'success.200' }}>
                                        <Typography variant="h4" fontWeight="bold" color="success.main">
                                            {resumen.cuotas_pagadas}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">CUOTAS PAGADAS</Typography>
                                    </Paper>

                                    <Paper variant="outlined" sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: hasOverdue ? 'error.50' : 'grey.50', borderColor: hasOverdue ? 'error.200' : 'divider' }}>
                                        <Typography variant="h4" fontWeight="bold" color={hasOverdue ? 'error.main' : 'text.disabled'}>
                                            {resumen.cuotas_vencidas}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">CUOTAS VENCIDAS</Typography>
                                    </Paper>
                                    
                                    <Paper variant="outlined" sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                                            {resumen.meses_proyecto}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL PLAN</Typography>
                                    </Paper>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                    <Divider />

                    {/* 3. DESGLOSE ECONÓMICO (Detalle de la Cuota) */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Estructura de la Cuota Mensual
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">BASE DEL CÁLCULO</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="body2">Cemento ({resumen.detalle_cuota.nombre_cemento})</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {resumen.detalle_cuota.valor_cemento_unidades} u. × ${resumen.detalle_cuota.valor_cemento.toLocaleString('es-AR')}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack spacing={1.5} sx={{ p: 2 }}>
                                <FilaDetalle label="Valor Móvil" value={resumen.detalle_cuota.valor_movil} />
                                <FilaDetalle label="Valor Mensual Base" value={resumen.detalle_cuota.valor_mensual} />
                                
                                <Divider sx={{ borderStyle: 'dashed' }} />
                                
                                <FilaDetalle label="Carga Administrativa" value={resumen.detalle_cuota.carga_administrativa} />
                                <FilaDetalle label="IVA Carga Admin." value={resumen.detalle_cuota.iva_carga_administrativa} />
                                
                                <Divider sx={{ my: 1 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">CUOTA FINAL A PAGAR</Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        ${resumen.detalle_cuota.valor_mensual_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Componente auxiliar para filas de detalle financiero
const FilaDetalle: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>
            ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </Typography>
    </Box>
);

export default DetalleResumenModal;