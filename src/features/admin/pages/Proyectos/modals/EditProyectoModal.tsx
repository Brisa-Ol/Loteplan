// src/components/Admin/Proyectos/Components/modals/EditProyectoModal.tsx

import {
    CalendarMonth as CalendarIcon,
    Description as DescriptionIcon,
    Edit as EditIcon,
    LocationOn as LocationIcon,
    MonetizationOn as MonetizationIcon,
    Save as SaveIcon,
    Public as WorldIcon
} from '@mui/icons-material';
import {
    Alert,
    alpha,
    Box,
    Chip,
    Divider,
    FormControlLabel,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useEffect } from 'react';
import * as Yup from 'yup';
import type { ProyectoDto, UpdateProyectoDto } from '../../../../../core/types/dto/proyecto.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

// --- FUNCIONES Y VARIABLES AUXILIARES ---

// Bloquea el tipeo de caracteres inválidos en campos numéricos (cantidades/plazos)
const blockInvalidChar = (e: React.KeyboardEvent) =>
    ['e', 'E', '-', '+'].includes(e.key) && e.preventDefault();

// Estilos del campo de fecha para mostrar el icono de MUI e invisibilizar el del navegador
const dateFieldSx = {
    '& .MuiInputBase-input': { color: 'text.primary' },
    '& input::-webkit-calendar-picker-indicator': {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        cursor: 'pointer',
        opacity: 0,
    },
};

interface EditProyectoModalProps {
    open: boolean;
    onClose: () => void;
    proyecto: ProyectoDto | null;
    onSubmit: (id: number, data: UpdateProyectoDto) => Promise<void>;
    isLoading?: boolean;
}

// --- ESQUEMA DE VALIDACIÓN ---
const validationSchema = Yup.object({
    nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
    descripcion: Yup.string().min(20, 'Describe mejor el proyecto (mín 20 car.)').required('Requerido'),
    forma_juridica: Yup.string().required('Requerido'),
    estado_proyecto: Yup.string().required('Requerido'),

    // Fechas
    fecha_inicio: Yup.date().required('Requerido'),
    fecha_cierre: Yup.date()
        .required('Requerido')
        .min(Yup.ref('fecha_inicio'), 'Debe ser posterior al inicio'),

    // Coordenadas (Permiten negativos)
    latitud: Yup.number().nullable().min(-90).max(90),
    longitud: Yup.number().nullable().min(-180).max(180),

    // Configuración Inversión
    obj_suscripciones: Yup.number().nullable().min(1, 'Mínimo 1'),
    suscripciones_minimas: Yup.number()
        .nullable()
        .min(1, 'Mínimo 1')
        .test('min-max', 'No puede superar al cupo máximo', function (value) {
            // Si no hay valor o no hay máximo definido aún, pasamos la validación
            if (!value || !this.parent.obj_suscripciones) return true;
            return value <= this.parent.obj_suscripciones;
        }),
    plazo_inversion: Yup.number().nullable().min(1, 'Mínimo 1 mes'),
});

const EditProyectoModal: React.FC<EditProyectoModalProps> = ({
    open, onClose, proyecto, onSubmit, isLoading = false
}) => {
    const theme = useTheme();

    const formik = useFormik<any>({
        initialValues: {
            nombre_proyecto: '',
            descripcion: '',
            forma_juridica: '',
            fecha_inicio: '',
            fecha_cierre: '',
            activo: true,
            estado_proyecto: 'En Espera',
            latitud: '',
            longitud: '',
            obj_suscripciones: '',
            suscripciones_minimas: '',
            plazo_inversion: '',
        },
        validationSchema: validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!proyecto) return;

            const cleanData = Object.fromEntries(
                Object.entries(values).map(([key, val]) => {
                    if (val === '') return [key, null];

                    if (proyecto.tipo_inversion === 'directo') {
                        if (key === 'obj_suscripciones' || key === 'suscripciones_minimas') return [key, 1];
                    }

                    if (['latitud', 'longitud', 'obj_suscripciones', 'suscripciones_minimas', 'plazo_inversion'].includes(key)) {
                        return [key, val !== null ? Number(val) : null];
                    }
                    return [key, val];
                })
            );

            try {
                await onSubmit(proyecto.id, cleanData as UpdateProyectoDto);
                onClose();
            } catch (error) {
                console.error('Error al editar:', error);
            }
        },
    });

    useEffect(() => {
        if (proyecto && open) {
            formik.setValues({
                nombre_proyecto: proyecto.nombre_proyecto || '',
                descripcion: proyecto.descripcion || '',
                forma_juridica: proyecto.forma_juridica || '',
                fecha_inicio: proyecto.fecha_inicio ? proyecto.fecha_inicio.split('T')[0] : '',
                fecha_cierre: proyecto.fecha_cierre ? proyecto.fecha_cierre.split('T')[0] : '',
                activo: proyecto.activo ?? true,
                estado_proyecto: proyecto.estado_proyecto || 'En Espera',
                latitud: proyecto.latitud ?? '',
                longitud: proyecto.longitud ?? '',
                obj_suscripciones: proyecto.obj_suscripciones ?? '',
                suscripciones_minimas: proyecto.suscripciones_minimas ?? '',
                plazo_inversion: proyecto.plazo_inversion ?? '',
            });
        }
    }, [proyecto, open]);

    if (!proyecto) return null;

    const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

    const getHelperText = (fieldName: string) => {
        return (formik.touched[fieldName] && formik.errors[fieldName]) as string | undefined;
    };

    const sectionTitleSx = {
        fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2,
        display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.72rem', letterSpacing: 0.5
    };

    return (
        <BaseModal
            open={open}
            onClose={() => { formik.resetForm(); onClose(); }}
            title="Editar Proyecto"
            icon={<EditIcon />}
            headerColor="primary"
            confirmText="Guardar Cambios"
            confirmButtonIcon={<SaveIcon />}
            onConfirm={formik.submitForm}
            isLoading={isLoading}
            disableConfirm={!formik.isValid || isLoading}
            maxWidth="md"
            disableEnforceFocus
            headerExtra={
                <Stack direction="row" spacing={1}>
                    <Chip label={proyecto.tipo_inversion?.toUpperCase()} size="small" color="secondary" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                    <Chip label={`ID: ${proyecto.id}`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                </Stack>
            }
        >
            <Stack spacing={4}>
                {/* 1. INFORMACIÓN PRINCIPAL */}
                <Box>
                    <Typography variant="subtitle2" sx={sectionTitleSx}>
                        <DescriptionIcon fontSize="inherit" /> Información del Desarrollo
                    </Typography>

                    <Stack spacing={2.5}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                fullWidth label="Nombre del Proyecto"
                                {...formik.getFieldProps('nombre_proyecto')}
                                error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                                helperText={getHelperText('nombre_proyecto')}
                                sx={{ ...commonInputSx, flex: 2 }}
                            />
                            <TextField
                                select fullWidth label="Estado"
                                {...formik.getFieldProps('estado_proyecto')}
                                sx={{ ...commonInputSx, flex: 1 }}
                            >
                                <MenuItem value="En Espera">En Espera</MenuItem>
                                <MenuItem value="En proceso">En Proceso</MenuItem>
                                <MenuItem value="Finalizado">Finalizado</MenuItem>
                                <MenuItem value="Cancelado">Cancelado</MenuItem>
                            </TextField>
                        </Stack>

                        <Box>
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                maxRows={10}
                                label="Descripción Comercial"
                                {...formik.getFieldProps('descripcion')}
                                error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
                                helperText={getHelperText('descripcion') || `${formik.values.descripcion?.length || 0} caracteres`}
                                sx={commonInputSx}
                            />
                        </Box>

                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <TextField
                                fullWidth label="Forma Jurídica"
                                {...formik.getFieldProps('forma_juridica')}
                                error={formik.touched.forma_juridica && Boolean(formik.errors.forma_juridica)}
                                helperText={getHelperText('forma_juridica')}
                                sx={commonInputSx}
                            />
                        </Box>
                    </Stack>
                </Box>

                <Divider />

                {/* 2. CRONOGRAMA */}
                <Box>
                    <Typography variant="subtitle2" sx={sectionTitleSx}>
                        <CalendarIcon fontSize="inherit" /> Plazos de Convocatoria
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth label="Fecha de Inicio" type="date" InputLabelProps={{ shrink: true }}
                            {...formik.getFieldProps('fecha_inicio')}
                            error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                            helperText={getHelperText('fecha_inicio')}
                            InputProps={{ endAdornment: <InputAdornment position="end"><CalendarIcon color="action" sx={{ pointerEvents: 'none' }} /></InputAdornment> }}
                            sx={{ ...commonInputSx, ...dateFieldSx }}
                        />
                        <TextField
                            fullWidth label="Fecha de Cierre" type="date" InputLabelProps={{ shrink: true }}
                            {...formik.getFieldProps('fecha_cierre')}
                            inputProps={{ min: formik.values.fecha_inicio || '' }} // No permite fecha de cierre anterior a la de inicio
                            error={formik.touched.fecha_cierre && Boolean(formik.errors.fecha_cierre)}
                            helperText={getHelperText('fecha_cierre')}
                            InputProps={{ endAdornment: <InputAdornment position="end"><CalendarIcon color="action" sx={{ pointerEvents: 'none' }} /></InputAdornment> }}
                            sx={{ ...commonInputSx, ...dateFieldSx }}
                        />
                    </Stack>
                </Box>

                {/* 3. CONFIGURACIÓN DE INVERSIÓN */}
                <Box>
                    <Typography variant="subtitle2" sx={sectionTitleSx}>
                        <MonetizationIcon fontSize="inherit" /> Parámetros de Inversión
                    </Typography>

                    {proyecto.tipo_inversion === 'directo' ? (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                            Este es un proyecto de <b>Inversión Directa</b>. El cupo y los mínimos están fijados en 1 (fondeo total) y no pueden ser modificados.
                        </Alert>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{ p: 2.5, border: `1px dashed ${theme.palette.primary.main}`, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth label="Cupo Máximo" type="number"
                                    onKeyDown={blockInvalidChar} inputProps={{ min: 1 }}
                                    {...formik.getFieldProps('obj_suscripciones')}
                                    onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                                    error={formik.touched.obj_suscripciones && Boolean(formik.errors.obj_suscripciones)}
                                    helperText={getHelperText('obj_suscripciones')}
                                    InputProps={{ endAdornment: <InputAdornment position="end">Planes</InputAdornment> }}
                                    sx={commonInputSx}
                                />
                                <TextField
                                    fullWidth label="Mínimo Requerido" type="number"
                                    onKeyDown={blockInvalidChar} inputProps={{ min: 1 }}
                                    {...formik.getFieldProps('suscripciones_minimas')}
                                    onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                                    error={formik.touched.suscripciones_minimas && Boolean(formik.errors.suscripciones_minimas)}
                                    helperText={getHelperText('suscripciones_minimas')}
                                    sx={commonInputSx}
                                />
                                <TextField
                                    fullWidth label="Plazo Inversión" type="number"
                                    onKeyDown={blockInvalidChar} inputProps={{ min: 1 }}
                                    {...formik.getFieldProps('plazo_inversion')}
                                    onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                                    error={formik.touched.plazo_inversion && Boolean(formik.errors.plazo_inversion)}
                                    helperText={getHelperText('plazo_inversion')}
                                    InputProps={{ endAdornment: <InputAdornment position="end">Meses</InputAdornment> }}
                                    sx={commonInputSx}
                                />
                            </Stack>
                        </Paper>
                    )}
                </Box>

                <Divider />

                {/* 4. LOCALIZACIÓN Y VISIBILIDAD */}
                <Box>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                        <Box sx={{ flex: 1, width: '100%' }}>
                            <Typography variant="subtitle2" sx={sectionTitleSx}>
                                <LocationIcon fontSize="inherit" /> Georreferenciación
                            </Typography>
                            {/* AQUÍ NO BLOQUEAMOS LOS NEGATIVOS PARA LAT Y LNG */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth label="Latitud" type="number"
                                    {...formik.getFieldProps('latitud')}
                                    error={formik.touched.latitud && Boolean(formik.errors.latitud)}
                                    helperText={getHelperText('latitud')}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action" /></InputAdornment> }}
                                    sx={commonInputSx}
                                />
                                <TextField
                                    fullWidth label="Longitud" type="number"
                                    {...formik.getFieldProps('longitud')}
                                    error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                                    helperText={getHelperText('longitud')}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action" /></InputAdornment> }}
                                    sx={commonInputSx}
                                />
                            </Stack>
                        </Box>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2, minWidth: 160, textAlign: 'center', borderRadius: 2,
                                borderColor: formik.values.activo ? 'success.main' : 'divider',
                                bgcolor: formik.values.activo ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                            }}
                        >
                            <Typography variant="caption" fontWeight={800} color={formik.values.activo ? 'success.main' : 'text.disabled'} display="block" mb={1}>
                                VISIBILIDAD PÚBLICA
                            </Typography>
                            <FormControlLabel
                                control={<Switch checked={!!formik.values.activo} onChange={(e) => formik.setFieldValue('activo', e.target.checked)} color="success" />}
                                label={<Typography variant="body2" fontWeight={700}>{formik.values.activo ? "ACTIVO" : "OCULTO"}</Typography>}
                                labelPlacement="bottom"
                                sx={{ m: 0 }}
                            />
                        </Paper>
                    </Stack>
                </Box>
            </Stack>
        </BaseModal>
    );
};

export default EditProyectoModal;