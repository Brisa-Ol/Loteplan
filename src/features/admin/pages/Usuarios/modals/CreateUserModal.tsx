import React, { useState } from 'react';
import {
    TextField, MenuItem, Stack, Box, Typography, IconButton, InputAdornment,
    Alert
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Visibility,
    VisibilityOff,
    BadgeOutlined as BadgeIcon,
    VpnKeyOutlined as KeyIcon,
    AdminPanelSettingsOutlined as RoleIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { CreateUsuarioDto } from '../../../../../core/types/dto/usuario.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
    // 👇 CAMBIO AQUÍ: Promise<any> en lugar de Promise<void>
    onSubmit: (data: CreateUsuarioDto) => Promise<any>;
    isLoading?: boolean;
}

// ════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════

const validationSchema = Yup.object({
    nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    email: Yup.string().email("Email inválido").required("Requerido"),
    dni: Yup.string().matches(/^\d+$/, "Solo números").min(7).max(8).required("Requerido"),
    nombre_usuario: Yup.string().min(4).required("Requerido"),
    numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10).required("Requerido"),
    contraseña: Yup.string()
        .min(8, "Mínimo 8 caracteres")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe tener mayúscula, minúscula y número")
        .required("Requerido"),
    rol: Yup.string().oneOf(['admin', 'cliente']).required("Requerido"),
});

// ════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════

const CreateUserModal: React.FC<CreateUserModalProps> = ({
    open, onClose, onSubmit, isLoading = false
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik<CreateUsuarioDto>({
        initialValues: {
            nombre: '', apellido: '', email: '', dni: '',
            nombre_usuario: '', numero_telefono: '', contraseña: '',
            rol: 'cliente',
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                await onSubmit(values);
                resetForm();
            } catch (error) {
                console.error("Error creating user", error);
            }
        },
    });

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        formik.setFieldValue(name, numericValue);
    };

    const handleClose = () => {
        formik.resetForm();
        onClose();
    };

    // Estilos reutilizables
    const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
    const sectionTitleSx = {
        textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700,
        color: 'text.secondary', fontSize: '0.75rem', mb: 1
    };

    return (
        <BaseModal
            open={open}
            onClose={handleClose}
            title="Crear Nuevo Usuario"
            subtitle="Complete los datos para registrar un acceso"
            icon={<PersonAddIcon />}
            headerColor="primary"
            confirmText="Confirmar Creación"
            confirmButtonIcon={<PersonAddIcon />}
            onConfirm={formik.submitForm}
            isLoading={isLoading}
            disableConfirm={!formik.isValid || isLoading}
            maxWidth="md"
        >
            <Stack spacing={4}>

                {/* SECCIÓN 1: DATOS PERSONALES */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <BadgeIcon color="action" fontSize="small" />
                        <Typography sx={sectionTitleSx}>Información Personal</Typography>
                    </Stack>

                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth id="nombre" label="Nombre"
                                {...formik.getFieldProps('nombre')}
                                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                                helperText={formik.touched.nombre && formik.errors.nombre}
                                disabled={isLoading} sx={commonInputSx}
                            />
                            <TextField
                                fullWidth id="apellido" label="Apellido"
                                {...formik.getFieldProps('apellido')}
                                error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                                helperText={formik.touched.apellido && formik.errors.apellido}
                                disabled={isLoading} sx={commonInputSx}
                            />
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth id="dni" name="dni" label="DNI"
                                value={formik.values.dni}
                                onChange={handleNumericChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.dni && Boolean(formik.errors.dni)}
                                helperText={formik.touched.dni && formik.errors.dni}
                                disabled={isLoading} sx={commonInputSx}
                            />
                            <TextField
                                fullWidth id="numero_telefono" name="numero_telefono" label="Teléfono"
                                value={formik.values.numero_telefono}
                                onChange={handleNumericChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                                helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                                disabled={isLoading} sx={commonInputSx}
                            />
                        </Stack>
                    </Stack>
                </Box>

                {/* SECCIÓN 2: ACCESO */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <KeyIcon color="action" fontSize="small" />
                        <Typography sx={sectionTitleSx}>Credenciales de Acceso</Typography>
                    </Stack>

                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth id="email" label="Email" type="email"
                                {...formik.getFieldProps('email')}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                disabled={isLoading} sx={commonInputSx}
                            />
                            <TextField
                                fullWidth id="nombre_usuario" label="Usuario"
                                {...formik.getFieldProps('nombre_usuario')}
                                error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                                helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                                disabled={isLoading} sx={commonInputSx}
                            />
                        </Stack>

                        <TextField
                            fullWidth id="contraseña" label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            {...formik.getFieldProps('contraseña')}
                            error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                            helperText={formik.touched.contraseña && formik.errors.contraseña}
                            disabled={isLoading} sx={commonInputSx}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end" disabled={isLoading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>
                </Box>

                {/* SECCIÓN 3: ROL Y AVISO */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <RoleIcon color="action" fontSize="small" />
                        <Typography sx={sectionTitleSx}>Permisos</Typography>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                        <TextField
                            fullWidth select id="rol" label="Rol del Usuario"
                            {...formik.getFieldProps('rol')}
                            disabled={isLoading} sx={{ ...commonInputSx, flex: 1 }}
                        >
                            <MenuItem value="cliente">Cliente</MenuItem>
                            <MenuItem value="admin">Administrador</MenuItem>
                        </TextField>

                        <Alert
                            severity="info" variant="outlined"
                            sx={{ flex: 1, alignItems: 'center', borderRadius: 2 }}
                        >
                            El usuario iniciará como "Inactivo".
                        </Alert>
                    </Stack>
                </Box>

            </Stack>
        </BaseModal>
    );
};

export default CreateUserModal;