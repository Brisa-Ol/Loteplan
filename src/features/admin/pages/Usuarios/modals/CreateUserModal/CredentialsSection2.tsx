// src/features/admin/pages/Usuarios/modals/sections/CredentialsSection.tsx

import type { CreateUsuarioDto } from '@/core/types/usuario.dto';
import { VpnKeyOutlined as KeyIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import type { FormikProps } from 'formik';
import React, { useState } from 'react';
import SectionTitle from '../components/SectionTitle';

const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface Props {
    formik: FormikProps<CreateUsuarioDto>;
    isLoading: boolean;
}

const CredentialsSection: React.FC<Props> = ({ formik, isLoading }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Stack spacing={2.5}>
            <SectionTitle icon={<KeyIcon color="primary" fontSize="small" />}>Credenciales de Seguridad</SectionTitle>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField fullWidth label="Correo Electrónico" type="email" {...formik.getFieldProps('email')}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={isLoading} sx={INPUT_SX}
                />
                <TextField fullWidth label="Nombre de Usuario (Login)" {...formik.getFieldProps('nombre_usuario')}
                    error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                    helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                    disabled={isLoading} sx={INPUT_SX}
                />
            </Stack>

            <TextField fullWidth label="Contraseña Temporal"
                type={showPassword ? 'text' : 'password'}
                {...formik.getFieldProps('contraseña')}
                error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                helperText={formik.touched.contraseña && formik.errors.contraseña}
                disabled={isLoading} sx={INPUT_SX}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(p => !p)} edge="end" disabled={isLoading}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
        </Stack>
    );
};

export default CredentialsSection;