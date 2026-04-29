// src/components/Admin/Proyectos/Components/modals/ConfigCuotasModal.tsx

import {
    CreditCard as CuotaIcon,
    History as HistoryIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import {
    alpha,
    Box, Button, Paper, Skeleton, Stack, Tab, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tabs,
    TextField, Typography, useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths } from 'date-fns';
import { useFormik } from 'formik';
import React, { useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';

import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import { env } from '@/core/config/env'; // 👈 1. Importamos env
import type { CreateCuotaMensualDto } from '@/core/types/cuotaMensual.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import ProyectoPriceHistory from '../components/ProyectoPriceHistory';

// ============================================================================
// INTERFACES Y VALIDACIÓN
// ============================================================================
interface ConfigCuotasModalProps {
    open: boolean;
    onClose: () => void;
    proyecto: ProyectoDto | null;
}

const blockInvalidChar = (e: React.KeyboardEvent) =>
    ['e', 'E', '-', '+'].includes(e.key) && e.preventDefault();

const validationSchema = Yup.object({
    valor_cemento_unidades: Yup.number().positive('Mínimo 1 unidad').required('Requerido'),
    valor_cemento: Yup.number().positive('Debe ser mayor a 0').required('Requerido'),
    porcentaje_plan: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
    porcentaje_administrativo: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
    porcentaje_iva: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const ConfigCuotasModal: React.FC<ConfigCuotasModalProps> = ({ open, onClose, proyecto }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useSnackbar();

    const [activeTab, setActiveTab] = useState(0);
    const [showHistory, setShowHistory] = useState(false);

    // --- Queries ---
    const { data: responseBackend, isLoading: isLoadingData } = useQuery({
        queryKey: ['cuotaActive', proyecto?.id],
        queryFn: async () => {
            if (!proyecto) return null;
            const res = await CuotaMensualService.getLastByProjectId(proyecto.id);
            return res.data;
        },
        enabled: open && !!proyecto && proyecto.tipo_inversion === 'mensual',
        retry: false,
        staleTime: env.queryStaleTime || 30000 // 👈 2. Consistencia en caché
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: async (data: CreateCuotaMensualDto) => (await CuotaMensualService.create(data)).data,
        onSuccess: (response) => {
            if (proyecto) {
                queryClient.invalidateQueries({ queryKey: ['cuotaActive', proyecto.id] });
                queryClient.invalidateQueries({ queryKey: ['adminCuotasMap'] });
            }
            showSuccess(response?.sincronizacion?.mensaje || 'Configuración actualizada');
            setShowHistory(true);
        },
        onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar')
    });

    // --- Formulario ---
    const formik = useFormik<CreateCuotaMensualDto>({
        initialValues: {
            id_proyecto: proyecto?.id || 0,
            valor_cemento_unidades: 1,
            valor_cemento: 0,
            porcentaje_plan: 70,
            porcentaje_administrativo: 16,
            porcentaje_iva: 21,
            nombre_cemento_cemento: 'Bolsa de Cemento'
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            if (!proyecto) return;
            createMutation.mutate({
                ...values,
                id_proyecto: proyecto.id,
                porcentaje_plan: values.porcentaje_plan / 100,
                porcentaje_administrativo: values.porcentaje_administrativo / 100,
                porcentaje_iva: values.porcentaje_iva / 100,
            });
        },
    });

    useEffect(() => {
        const cuota = responseBackend?.cuota;
        if (cuota) {
            const normalizePct = (val: any) => {
                const n = Number(val);
                return n <= 1 ? n * 100 : n;
            };

            formik.setValues({
                id_proyecto: proyecto?.id || 0,
                nombre_cemento_cemento: cuota.nombre_cemento_cemento || '',
                valor_cemento_unidades: Number(cuota.valor_cemento_unidades),
                valor_cemento: Number(cuota.valor_cemento),
                porcentaje_plan: normalizePct(cuota.porcentaje_plan),
                porcentaje_administrativo: normalizePct(cuota.porcentaje_administrativo),
                porcentaje_iva: normalizePct(cuota.porcentaje_iva),
            });
        }
    }, [responseBackend, proyecto]);

    // --- Cálculos Proyectados ---
    const calculos = useMemo(() => {
        const plazo = proyecto?.plazo_inversion || 1;
        const unidades = Number(formik.values.valor_cemento_unidades) || 0;
        const precio = Number(formik.values.valor_cemento) || 0;

        const roundTo2 = (n: number) => Math.round(n * 100) / 100;

        const valorMovil = unidades * precio;

        const totalDelPlan = valorMovil * Number(formik.values.porcentaje_plan / 100);
        const valorMensual = totalDelPlan / plazo;

        // 2. Carga Administrativa

        const cargaAdminTotal = valorMovil * (Number(formik.values.porcentaje_administrativo) / 100);
        const cargaAdmin = cargaAdminTotal;

        // 3. IVA Administrativo

        const ivaCarga = cargaAdmin * (Number(formik.values.porcentaje_iva) / 100);

        // 4. Valor Final Redondeado
        const valorFinal = roundTo2(valorMensual + cargaAdmin + ivaCarga);

        return { valorMensual, cargaAdmin, ivaCarga, valorFinal, valorMovil };
    }, [formik.values, proyecto]);

    const cronograma = useMemo(() => {
        if (!proyecto?.fecha_inicio) return [];
        return Array.from({ length: proyecto.plazo_inversion || 0 }).map((_, i) => ({
            nro: i + 1,
            fecha: addMonths(new Date(proyecto.fecha_inicio), i + 1),
            ...calculos
        }));
    }, [proyecto, calculos]);

    // --- Estilos Memorizados ---
    const styles = useMemo(() => ({
        input: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
        calcPaper: {
            p: 3,
            borderRadius: 3,
            bgcolor: "#D4D4D4",
            color: "text.primary",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        tableHeader: { fontWeight: 800, bgcolor: alpha(theme.palette.background.default, 0.8) }
    }), [theme]);

    if (!proyecto) return null;

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title="Configuración de Cuotas"
            subtitle={proyecto.nombre_proyecto}
            icon={<CuotaIcon />}
            maxWidth="md"
            isLoading={createMutation.isPending}
            headerExtra={
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} >
                    <Tab label="Variables" sx={{ fontWeight: 800 }} />
                    <Tab label="Proyección" sx={{ fontWeight: 800 }} />
                </Tabs>
            }
            customActions={
                <>
                    {activeTab === 0 && (
                        <Button
                            onClick={() => setShowHistory(!showHistory)}
                            startIcon={<HistoryIcon />}
                            color="inherit"
                            sx={{ mr: 'auto', borderRadius: 2, fontWeight: 700 }}
                        >
                            {showHistory ? 'Ocultar' : 'Ver'} Historial
                        </Button>
                    )}
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>Cerrar</Button>
                    {activeTab === 0 && (
                        <Button
                            onClick={formik.submitForm}
                            variant="contained"
                            disabled={createMutation.isPending || !formik.isValid}
                            startIcon={<SaveIcon />}
                            sx={{ px: 4, fontWeight: 800, borderRadius: 2 }}
                        >
                            Actualizar Valor
                        </Button>
                    )}
                </>
            }
        >
            <Stack spacing={3}>
                {activeTab === 0 ? (
                    <Box>
                        {isLoadingData ? (
                            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
                        ) : (
                            <Stack spacing={3}>
                                <Typography>Plan de {proyecto?.plazo_inversion} meses</Typography>
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2 }}>
                                    <TextField fullWidth label="Insumo de Referencia" sx={styles.input} {...formik.getFieldProps('nombre_cemento_cemento')} />
                                    <TextField fullWidth label="Unidades" type="number" sx={styles.input} {...formik.getFieldProps('valor_cemento_unidades')} onKeyDown={blockInvalidChar} />
                                    <TextField fullWidth label="Precio Unitario" type="number" sx={styles.input} {...formik.getFieldProps('valor_cemento')} InputProps={{ startAdornment: '$' }} onKeyDown={blockInvalidChar} />
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                    <TextField label="% Capital" type="number" sx={styles.input} {...formik.getFieldProps('porcentaje_plan')} InputProps={{ endAdornment: '%' }} />
                                    <TextField label="% Admin" type="number" sx={styles.input} {...formik.getFieldProps('porcentaje_administrativo')} InputProps={{ endAdornment: '%' }} />
                                    <TextField label="% IVA Admin" type="number" sx={styles.input} {...formik.getFieldProps('porcentaje_iva')} InputProps={{ endAdornment: '%' }} />
                                </Box>

                                <Paper elevation={0} sx={styles.calcPaper}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, opacity: 0.9, letterSpacing: 0.5 }}>CUOTA MENSUAL ESTIMADA</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>
                                            Valor movil: ${calculos.valorMovil.toFixed(2)} | Pura: ${calculos.valorMensual.toFixed(2)} + Gastos: ${(calculos.cargaAdmin + calculos.ivaCarga).toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" fontWeight={900}>
                                        {/* 👈 3. Aplicamos env.defaultLocale */}
                                        ${calculos.valorFinal.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Paper>

                                {showHistory && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>
                                            Historial de Actualizaciones
                                        </Typography>
                                        <ProyectoPriceHistory proyectoId={proyecto.id} />
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, maxHeight: 450 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.tableHeader}>Nº</TableCell>
                                    <TableCell sx={styles.tableHeader}>Vencimiento</TableCell>
                                    <TableCell align="right" sx={styles.tableHeader}>Cuota Pura</TableCell>
                                    <TableCell align="right" sx={styles.tableHeader}>Admin + IVA</TableCell>
                                    <TableCell align="right" sx={styles.tableHeader}>Total Final</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cronograma.map((row) => (
                                    <TableRow key={row.nro} hover>
                                        <TableCell sx={{ fontWeight: 700 }}>{row.nro}</TableCell>
                                        {/* 👈 4. Aplicamos env.defaultLocale en todas las celdas */}
                                        <TableCell sx={{ fontWeight: 500 }}>{row.fecha.toLocaleDateString(env.defaultLocale, { month: 'short', year: 'numeric' }).toUpperCase()}</TableCell>
                                        <TableCell align="right">${row.valorMensual.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell align="right" sx={{ color: 'text.secondary' }}>${(row.cargaAdmin + row.ivaCarga).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                            ${row.valorFinal.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Stack>
        </BaseModal>
    );
};

export default ConfigCuotasModal;