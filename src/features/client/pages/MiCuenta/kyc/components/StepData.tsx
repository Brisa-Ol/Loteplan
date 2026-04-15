import type { TipoDocumento } from '@/core/types/kyc.dto';
import { Person } from '@mui/icons-material';
import { alpha, Avatar, Box, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useFormik } from 'formik';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import * as Yup from 'yup';

// 👇 1. Importamos el contexto de autenticación
import { useAuth } from '@/core/context/AuthContext';

// ─── Tipos públicos ─────────────────────────────────────────────────────────
export interface StepDataValues {
    tipo_documento: TipoDocumento;
    numero_documento: string;
    nombre_completo: string;
    fecha_nacimiento: string;
}

export interface StepDataRef {
    /** Toca todos los campos, muestra errores inline y retorna si el form es válido */
    validate: () => Promise<boolean>;
    /** Devuelve los valores actuales del form */
    getValues: () => StepDataValues;
}

interface StepDataProps {
    data: StepDataValues;
    onChange: (values: StepDataValues) => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────
export const StepData = forwardRef<StepDataRef, StepDataProps>(({ data, onChange }, ref) => {
    const theme = useTheme();

    // 👇 2. Obtenemos los datos del usuario logueado
    const { user } = useAuth();

    // 👇 3. Movemos el schema adentro del componente y usamos useMemo
    const schema = useMemo(() => {
        const maxBirthDate = new Date();
        maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);

        return Yup.object({
            tipo_documento: Yup.string().required('Selecciona un tipo de documento'),
            numero_documento: Yup.string()
                .required('El número de documento es obligatorio')
                .min(6, 'Mínimo 6 caracteres')
                // ✨ AQUÍ OCURRE LA MAGIA: Comparamos con el DNI registrado
                .test(
                    'coincide-dni',
                    'El número debe coincidir con el DNI con el que te registraste',
                    (value) => {
                        if (!value || !user?.dni) return true; // Si está vacío lo frena el "required"
                        return value === user.dni;
                    }
                ),
            nombre_completo: Yup.string()
                .required('El nombre completo es obligatorio')
                .min(3, 'Mínimo 3 caracteres'),
            fecha_nacimiento: Yup.date()
                .typeError('Ingresa una fecha válida')
                .required('La fecha de nacimiento es obligatoria')
                .max(maxBirthDate, 'Debes ser mayor de 18 años para continuar'),
        });
    }, [user?.dni]); // Se recalcula solo si cambia el DNI del usuario (prácticamente nunca)

    const formik = useFormik<StepDataValues>({
        initialValues: data,
        validationSchema: schema, // <-- Usamos nuestro esquema dinámico
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: () => { },          // el submit real ocurre en el padre
    });

    // Sincroniza estado de formik y filtra caracteres no deseados
    const handleChange = (field: keyof StepDataValues, value: string) => {
        let filtered = value;

        if (field === 'numero_documento') {
            filtered = value.replace(/\D/g, '');           // solo dígitos
        }

        if (field === 'nombre_completo') {
            filtered = value.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, ''); // solo letras y espacios
        }

        formik.setFieldValue(field, filtered);
        if (formik.errors[field]) {
            formik.setFieldError(field, undefined);
        }
    };

    // API expuesta al padre mediante ref
    useImperativeHandle(ref, () => ({
        validate: async () => {
            // Marca todos los campos como tocados para que aparezcan los errores
            const allTouched = Object.keys(schema.fields).reduce(
                (acc, k) => ({ ...acc, [k]: true }),
                {}
            );
            await formik.setTouched(allTouched, true);
            const errors = await formik.validateForm();
            return Object.keys(errors).length === 0;
        },
        getValues: () => formik.values,
    }));

    return (
        <Stack spacing={4}>
            {/* HEADER */}
            <Box>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <Person />
                    </Avatar>
                    <Typography variant="h5">Información Básica</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Ingresa tus datos tal cual figuran en tu documento.
                </Typography>
            </Box>

            {/* FORMULARIO */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                <TextField
                    select
                    fullWidth
                    label="Tipo Documento"
                    value={formik.values.tipo_documento}
                    onChange={(e) => handleChange('tipo_documento', e.target.value)}
                    onBlur={formik.handleBlur('tipo_documento')}
                    error={formik.touched.tipo_documento && Boolean(formik.errors.tipo_documento)}
                    helperText={formik.touched.tipo_documento && formik.errors.tipo_documento}
                >
                    {(['DNI', 'PASAPORTE', 'LICENCIA'] as TipoDocumento[]).map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    label="Número Documento"
                    value={formik.values.numero_documento}
                    onChange={(e) => handleChange('numero_documento', e.target.value)}
                    onBlur={formik.handleBlur('numero_documento')}
                    error={formik.touched.numero_documento && Boolean(formik.errors.numero_documento)}
                    helperText={formik.touched.numero_documento && formik.errors.numero_documento}
                    inputProps={{ inputMode: 'numeric', maxLength: 15 }}   // ← teclado numérico en móvil
                />

                <Box sx={{ gridColumn: '1 / -1' }}>
                    <TextField
                        fullWidth
                        label="Nombre Completo"
                        autoComplete="name" // Ayuda al navegador a autocompletar
                        value={formik.values.nombre_completo}
                        onChange={(e) => handleChange('nombre_completo', e.target.value)}
                        onBlur={formik.handleBlur('nombre_completo')}
                        error={formik.touched.nombre_completo && Boolean(formik.errors.nombre_completo)}
                        helperText={formik.touched.nombre_completo && formik.errors.nombre_completo}
                        inputProps={{ maxLength: 100 }}
                    />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                    <TextField
                        fullWidth
                        type="date"
                        label="Fecha Nacimiento"
                        autoComplete="bday" // Ayuda al navegador a autocompletar
                        value={formik.values.fecha_nacimiento}
                        onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                        onBlur={formik.handleBlur('fecha_nacimiento')}
                        error={formik.touched.fecha_nacimiento && Boolean(formik.errors.fecha_nacimiento)}
                        helperText={formik.touched.fecha_nacimiento && formik.errors.fecha_nacimiento}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </Box>
        </Stack>
    );
});

StepData.displayName = 'StepData';