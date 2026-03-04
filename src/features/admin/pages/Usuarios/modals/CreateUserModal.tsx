// src/features/admin/pages/Usuarios/modals/CreateUserModal.tsx

import type { CreateUsuarioDto } from '@/core/types/dto/usuario.dto';
import { BaseModal } from '@/shared/components/domain/modals';
import {
    BadgeOutlined as BadgeIcon,
    VpnKeyOutlined as KeyIcon,
    PersonAdd as PersonAddIcon,
    AdminPanelSettingsOutlined as RoleIcon,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Divider,
    IconButton, InputAdornment,
    MenuItem, Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useCallback, useMemo, useState } from 'react';
import * as Yup from 'yup';

// ============================================================================
// INTERFACES
// ============================================================================
interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUsuarioDto) => Promise<any>;
    isLoading?: boolean;
}

// ============================================================================
// VALIDACIÓN (Yup)
// ============================================================================
const validationSchema = Yup.object({
    nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    email: Yup.string().email("Email inválido").required("Requerido"),
    dni: Yup.string().matches(/^\d+$/, "Solo números").min(7).max(8).required("Requerido"),
    nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("Requerido"),
    numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Mínimo 10 dígitos").required("Requerido"),
    contraseña: Yup.string()
        .min(8, "Mínimo 8 caracteres")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe tener mayúscula, minúscula y número")
        .required("Requerido"),
    rol: Yup.string().oneOf(['admin', 'cliente']).required("Requerido"),
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const CreateUserModal: React.FC<CreateUserModalProps> = ({
    open, onClose, onSubmit, isLoading = false
}) => {
    const theme = useTheme();
    const [showPassword, setShowPassword] = useState(false);

    // --- Formik logic ---
    const formik = useFormik<CreateUsuarioDto>({
        initialValues: {
            nombre: '', apellido: '', email: '', dni: '',
            nombre_usuario: '', numero_telefono: '', contraseña: '',
            rol: 'cliente',
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                await onSubmit(values);
                resetForm();
            } catch (error) {
                console.error("Error creating user", error);
            }
        },
    });

    // --- Handlers ---
    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        formik.setFieldValue(name, numericValue);
    };

    const handleClose = useCallback(() => {
        formik.resetForm();
        onClose();
    }, [formik, onClose]);

    // --- Estilos Memorizados ---
    const styles = useMemo(() => ({
        input: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
        sectionTitle: {
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 800,
            color: 'text.secondary',
            fontSize: '0.65rem',
            mb: 1
        }
    }), []);

    return (
        <BaseModal
            open={open}
            onClose={handleClose}
            title="Registrar Nuevo Usuario"
            subtitle="Defina los datos personales y credenciales de acceso"
            icon={<PersonAddIcon />}
            headerColor="primary"
            confirmText="Crear Usuario"
            confirmButtonIcon={<PersonAddIcon />}
            onConfirm={formik.submitForm}
            isLoading={isLoading}
            disableConfirm={!formik.isValid || isLoading}
            maxWidth="md"
        >
            <Stack spacing={4}>

                {/* SECCIÓN 1: DATOS PERSONALES */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <BadgeIcon color="primary" fontSize="small" />
                        <Typography sx={styles.sectionTitle}>Identidad y Contacto</Typography>
                    </Stack>

                    <Stack spacing={2.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth id="nombre" label="Nombre"
                                {...formik.getFieldProps('nombre')}
                                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                                helperText={formik.touched.nombre && formik.errors.nombre}
                                disabled={isLoading} sx={styles.input}
                            />
                            <TextField
                                fullWidth id="apellido" label="Apellido"
                                {...formik.getFieldProps('apellido')}
                                error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                                helperText={formik.touched.apellido && formik.errors.apellido}
                                disabled={isLoading} sx={styles.input}
                            />
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth id="dni" name="dni" label="DNI (Sin puntos)"
                                value={formik.values.dni}
                                onChange={handleNumericChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.dni && Boolean(formik.errors.dni)}
                                helperText={formik.touched.dni && formik.errors.dni}
                                disabled={isLoading} sx={styles.input}
                            />
                            <TextField
                                fullWidth id="numero_telefono" name="numero_telefono" label="Teléfono Celular"
                                value={formik.values.numero_telefono}
                                onChange={handleNumericChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                                helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                                disabled={isLoading} sx={styles.input}
                                placeholder="Ej: 1123456789"
                            />
                        </Stack>
                    </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* SECCIÓN 2: ACCESO */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <KeyIcon color="primary" fontSize="small" />
                        <Typography sx={styles.sectionTitle}>Credenciales de Seguridad</Typography>
                    </Stack>

                    <Stack spacing={2.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth id="email" label="Correo Electrónico" type="email"
                                {...formik.getFieldProps('email')}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                disabled={isLoading} sx={styles.input}
                            />
                            <TextField
                                fullWidth id="nombre_usuario" label="Nombre de Usuario (Login)"
                                {...formik.getFieldProps('nombre_usuario')}
                                error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                                helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                                disabled={isLoading} sx={styles.input}
                            />
                        </Stack>

                        <TextField
                            fullWidth id="contraseña" label="Contraseña Temporal"
                            type={showPassword ? 'text' : 'password'}
                            {...formik.getFieldProps('contraseña')}
                            error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                            helperText={formik.touched.contraseña && formik.errors.contraseña}
                            disabled={isLoading} sx={styles.input}
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

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* SECCIÓN 3: ROL */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <RoleIcon color="primary" fontSize="small" />
                        <Typography sx={styles.sectionTitle}>Permisos del Sistema</Typography>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            fullWidth select id="rol" label="Rol Asignado"
                            {...formik.getFieldProps('rol')}
                            disabled={isLoading} sx={{ ...styles.input, flex: 1 }}
                        >
                            <MenuItem value="cliente">Cliente </MenuItem>
                            <MenuItem value="admin">Administrador </MenuItem>
                        </TextField>

                        <Alert
                            severity="info"
                            variant="outlined"
                            sx={{ flex: 1.2, alignItems: 'center', borderRadius: 2 }}
                        >
                            El nuevo usuario deberá ser <b>activado manualmente</b> por un administrador.
                        </Alert>
                    </Stack>
                </Box>

            </Stack>
        </BaseModal>
    );
};

export default CreateUserModal;