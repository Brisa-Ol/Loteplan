// src/components/Admin/Proyectos/Components/modals/ConfigCuotasModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
    Button, TextField, Stack, Box, Typography,
    CircularProgress, Alert, useTheme, alpha, Paper, InputAdornment, Skeleton,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    CreditCard as CuotaIcon,
    Save as SaveIcon,
    History as HistoryIcon,
    Calculate as CalculateIcon,
    Description as DescriptionIcon,
    Warning as WarningIcon,
    ListAlt as ListIcon,
    Edit as EditIcon,
    CalendarMonth as DateIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths } from 'date-fns';

import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import type { CreateCuotaMensualDto } from '@/core/types/dto/cuotaMensual.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import ProyectoPriceHistory from '../components/ProyectoPriceHistory';

interface ConfigCuotasModalProps {
    open: boolean;
    onClose: () => void;
    proyecto: ProyectoDto | null;
}

const validationSchema = Yup.object({
    nombre_cemento_cemento: Yup.string().nullable(),
    valor_cemento_unidades: Yup.number().min(1, 'Mínimo 1 unidad').required('Requerido'),
    valor_cemento: Yup.number().min(0.01, 'Debe ser mayor a 0').required('Requerido'),
    porcentaje_plan: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
    porcentaje_administrativo: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
    porcentaje_iva: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
});

const ConfigCuotasModal: React.FC<ConfigCuotasModalProps> = ({ open, onClose, proyecto }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useSnackbar();

    // --- 1. HOOKS (SIEMPRE PRIMERO) ---
    const [activeTab, setActiveTab] = useState(0);
    const [showHistory, setShowHistory] = useState(false);

    // Query: Obtener configuración
    const { data: responseBackend, isLoading: isLoadingData } = useQuery({
        queryKey: ['cuotaActive', proyecto?.id],
        queryFn: async () => {
            if (!proyecto) return null;
            try {
                const res = await CuotaMensualService.getLastByProjectId(proyecto.id);
                return res.data;
            } catch (error) {
                return null;
            }
        },
        // Solo se ejecuta si hay proyecto Y es mensual
        enabled: open && !!proyecto && proyecto.tipo_inversion === 'mensual',
        retry: false
    });

    // Mutation: Crear Configuración
    const createMutation = useMutation({
        mutationFn: async (data: CreateCuotaMensualDto) => (await CuotaMensualService.create(data)).data,
        onSuccess: (response) => {
            if (proyecto) {
                queryClient.invalidateQueries({ queryKey: ['cuotaActive', proyecto.id] });
                queryClient.invalidateQueries({ queryKey: ['cuotasList', proyecto.id] });
                queryClient.invalidateQueries({ queryKey: ['proyecto', String(proyecto.id)] });
            }
            queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });

            const msg = response?.sincronizacion?.mensaje || 'Valores actualizados correctamente.';
            showSuccess(msg);
            setShowHistory(true);
        },
        onError: (err: any) => {
            console.error(err);
            showError((err.response?.data?.error) || 'Error al guardar la configuración');
        }
    });

    // Formik
    const formik = useFormik<CreateCuotaMensualDto>({
        initialValues: {
            id_proyecto: proyecto?.id || 0,
            nombre_proyecto: proyecto?.nombre_proyecto || '',
            total_cuotas_proyecto: proyecto?.plazo_inversion || 0,
            nombre_cemento_cemento: '',
            valor_cemento_unidades: 1,
            valor_cemento: 0,
            porcentaje_plan: 85,
            porcentaje_administrativo: 19,
            porcentaje_iva: 21,
        },
        validationSchema: validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!proyecto) return;
            try {
                await createMutation.mutateAsync({
                    ...values,
                    id_proyecto: proyecto.id,
                    nombre_proyecto: proyecto.nombre_proyecto,
                    total_cuotas_proyecto: proyecto.plazo_inversion || 12,
                    // Conversión a decimal para backend
                    porcentaje_administrativo: values.porcentaje_administrativo / 100,
                    porcentaje_iva: values.porcentaje_iva / 100,
                    porcentaje_plan: values.porcentaje_plan / 100
                });
            } catch (error) {
                console.error('Error al enviar:', error);
            }
        },
    });

    // Efecto: Cargar datos iniciales
    useEffect(() => {
        const cuotaData = responseBackend?.cuota;
        if (cuotaData) {
            const pPlan = Number(cuotaData.porcentaje_plan);
            const pAdmin = Number(cuotaData.porcentaje_administrativo);
            const pIva = Number(cuotaData.porcentaje_iva);

            formik.setValues({
                id_proyecto: proyecto?.id || 0,
                nombre_proyecto: proyecto?.nombre_proyecto || '',
                total_cuotas_proyecto: proyecto?.plazo_inversion || 0,
                nombre_cemento_cemento: cuotaData.nombre_cemento_cemento || '',
                valor_cemento_unidades: Number(cuotaData.valor_cemento_unidades) || 0,
                valor_cemento: Number(cuotaData.valor_cemento) || 0,
                // Conversión a entero para input
                porcentaje_plan: pPlan <= 1 ? pPlan * 100 : pPlan,
                porcentaje_administrativo: pAdmin <= 1 ? pAdmin * 100 : pAdmin,
                porcentaje_iva: pIva <= 1 ? pIva * 100 : pIva,
            });
        }
    }, [responseBackend, proyecto]);

    // --- CÁLCULOS (HOOKS DEBEN ESTAR AQUÍ ANTES DE CUALQUIER RETURN) ---

    const plazo = proyecto?.plazo_inversion || 1;
    const unidades = Number(formik.values.valor_cemento_unidades) || 0;
    const precioUnitario = Number(formik.values.valor_cemento) || 0;

    const pctPlanDecimal = Number(formik.values.porcentaje_plan) / 100;
    const pctAdminDecimal = Number(formik.values.porcentaje_administrativo) / 100;
    const pctIvaDecimal = Number(formik.values.porcentaje_iva) / 100;

    const valorMovil = unidades * precioUnitario;
    const valorMensualFull = valorMovil / plazo;
    const totalDelPlan = valorMovil * pctPlanDecimal;
    const valorMensualPlan = totalDelPlan / plazo;
    const cargaAdministrativa = valorMensualFull * pctAdminDecimal;
    const ivaCarga = cargaAdministrativa * pctIvaDecimal;
    const valorMensualFinal = valorMensualPlan + cargaAdministrativa + ivaCarga;

    // useMemo: Cronograma (EL QUE DABA ERROR)
    const cronogramaProyectado = useMemo(() => {
        // 🛡️ Guarda de seguridad DENTRO del hook
        if (!proyecto || !proyecto.fecha_inicio) return [];

        const cuotas = [];
        const fechaInicio = new Date(proyecto.fecha_inicio);

        for (let i = 1; i <= plazo; i++) {
            const fechaCuota = addMonths(fechaInicio, i);
            cuotas.push({
                nro: i,
                fecha: fechaCuota,
                valor: valorMensualFinal,
                capital: valorMensualPlan,
                gastos: cargaAdministrativa + ivaCarga
            });
        }
        return cuotas;
    }, [plazo, proyecto?.fecha_inicio, valorMensualFinal, valorMensualPlan, cargaAdministrativa, ivaCarga]);

    // --- HANDLERS ---
    const handleClose = () => {
        formik.resetForm();
        setShowHistory(false);
        setActiveTab(0);
        onClose();
    };

    const sectionTitleSx = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' };

    // --- 2. EARLY RETURNS (AHORA SÍ ES SEGURO) ---
    if (!proyecto) return null;

    if (proyecto.tipo_inversion !== 'mensual') {
        return (
            <BaseModal open={open} onClose={handleClose} title="No Disponible" icon={<WarningIcon />} hideConfirmButton cancelText="Cerrar">
                <Typography>Solo para proyectos mensuales.</Typography>
            </BaseModal>
        );
    }

    // --- 3. RENDER ---
    return (
        <BaseModal
            open={open}
            onClose={handleClose}
            title="Gestión de Cuotas"
            subtitle="Actualice el valor del metro/cemento para impactar en las próximas cuotas"
            icon={<CuotaIcon />}
            headerColor="primary"
            maxWidth="md"
            isLoading={createMutation.isPending}
            customActions={
                <>
                    {activeTab === 0 && (
                        <Button
                            onClick={() => setShowHistory(!showHistory)}
                            startIcon={<HistoryIcon />}
                            color="inherit"
                            disabled={createMutation.isPending}
                            sx={{ mr: 'auto', borderRadius: 2 }}
                        >
                            {showHistory ? 'Ocultar' : 'Ver'} Historial
                        </Button>
                    )}

                    <Button onClick={handleClose} color="inherit" disabled={createMutation.isPending} sx={{ borderRadius: 2, ml: activeTab === 1 ? 'auto' : 0 }}>
                        Cerrar
                    </Button>

                    {activeTab === 0 && (
                        <Button
                            onClick={formik.submitForm}
                            variant="contained"
                            disabled={createMutation.isPending || !formik.isValid}
                            startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            sx={{ px: 3, borderRadius: 2, fontWeight: 700 }}
                        >
                            {createMutation.isPending ? 'Guardando...' : 'Actualizar Valor'}
                        </Button>
                    )}
                </>
            }
        >
            <Stack spacing={3}>

                {/* HEADER INFO */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="caption" color="primary.main" fontWeight={700} textTransform="uppercase">PROYECTO ACTIVO</Typography>
                            <Typography variant="h6" fontWeight={800} color="text.primary">{proyecto.nombre_proyecto}</Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary">Plazo Total</Typography>
                            <Typography variant="h6" fontWeight={700}>{proyecto.plazo_inversion} Meses</Typography>
                        </Box>
                    </Stack>
                </Paper>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
                        <Tab icon={<EditIcon fontSize="small" />} iconPosition="start" label="Configuración de Precios" />
                        <Tab icon={<ListIcon fontSize="small" />} iconPosition="start" label="Proyección de Pagos" />
                    </Tabs>
                </Box>

                {/* TAB 0: CONFIGURACIÓN */}
                {activeTab === 0 && (
                    <Box sx={{ pt: 1 }}>
                        {isLoadingData ? (
                            <Stack spacing={2}><Skeleton height={60} /><Skeleton height={60} /></Stack>
                        ) : (
                            <Stack spacing={3}>
                                <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }} icon={<WarningIcon />}>
                                    Esta acción actualizará el valor de la cuota para <strong>todos los suscriptores</strong> activos a partir del próximo vencimiento.
                                </Alert>

                                <Box>
                                    <Typography variant="subtitle2" sx={sectionTitleSx}><DescriptionIcon fontSize="inherit" /> Referencia de Valor</Typography>
                                    <Stack spacing={2}>
                                        <TextField fullWidth label="Referencia (Ej: Bolsa Cemento)" {...formik.getFieldProps('nombre_cemento_cemento')} disabled={createMutation.isPending} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                            <TextField fullWidth label="Unidades" type="number" {...formik.getFieldProps('valor_cemento_unidades')} error={Boolean(formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades)} disabled={createMutation.isPending} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                            <TextField fullWidth label="Precio Unitario" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} {...formik.getFieldProps('valor_cemento')} error={Boolean(formik.touched.valor_cemento && formik.errors.valor_cemento)} disabled={createMutation.isPending} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" sx={sectionTitleSx}><CalculateIcon fontSize="inherit" /> Distribución Porcentual</Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <TextField fullWidth label="% Plan (Capital)" type="number" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} {...formik.getFieldProps('porcentaje_plan')} disabled={createMutation.isPending} />
                                        <TextField fullWidth label="% Admin" type="number" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} {...formik.getFieldProps('porcentaje_administrativo')} disabled={createMutation.isPending} />
                                        <TextField fullWidth label="% IVA" type="number" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} {...formik.getFieldProps('porcentaje_iva')} disabled={createMutation.isPending} />
                                    </Stack>
                                </Box>

                                <Alert severity="info" sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' }, border: '1px solid', borderColor: 'info.main' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="info.main">NUEVA CUOTA FINAL</Typography>
                                            <Typography variant="caption" display="block">Cuota Pura: ${valorMensualPlan.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                            <Typography variant="caption" display="block">Gastos: ${(cargaAdministrativa + ivaCarga).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                        </Box>
                                        <Typography variant="h4" fontWeight={800} color="primary.main">
                                            ${valorMensualFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Stack>
                                </Alert>

                                {showHistory && (
                                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                                        <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <HistoryIcon fontSize="small" /> HISTORIAL DE CAMBIOS
                                        </Typography>
                                        <ProyectoPriceHistory proyectoId={proyecto.id} />
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* TAB 1: CRONOGRAMA */}
                {activeTab === 1 && (
                    <Box sx={{ pt: 1 }}>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>Vencimiento</TableCell>
                                        <TableCell align="right">Capital</TableCell>
                                        <TableCell align="right">Gastos</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cronogramaProyectado.map((row) => (
                                        <TableRow key={row.nro} hover>
                                            <TableCell sx={{ fontWeight: 700 }}>{row.nro}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" gap={1}>
                                                    <DateIcon fontSize="inherit" color="action" />
                                                    {row.fecha.toLocaleDateString()}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">${row.capital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary' }}>${row.gastos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                ${row.valor.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center', fontStyle: 'italic' }}>
                            * Proyección basada en valores actuales.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </BaseModal>
    );
};

export default ConfigCuotasModal;