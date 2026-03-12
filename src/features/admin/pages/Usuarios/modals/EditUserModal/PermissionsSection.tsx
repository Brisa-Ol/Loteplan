// src/features/admin/pages/Usuarios/modals/sections/PermissionsSection.tsx

import {
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    AdminPanelSettingsOutlined as SettingsIcon,
} from '@mui/icons-material';
import { Alert, alpha, Avatar, Box, MenuItem, Stack, Switch, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import type { FormikProps } from 'formik';
import React from 'react';
import SectionTitle from '../components/SectionTitle';

const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface Props {
    formik: FormikProps<any>;
    isLoading: boolean;
    isSelfEditing: boolean;
}

const PermissionsSection: React.FC<Props> = ({ formik, isLoading, isSelfEditing }) => {
    const theme = useTheme();
    const isActive = formik.values.activo;

    return (
        <Box>
            <SectionTitle icon={<SettingsIcon fontSize="inherit" />}>Permisos y Estado</SectionTitle>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                <Tooltip title={isSelfEditing ? "No puedes cambiar tu propio rol" : ""}>
                    <TextField select label="Rol del Sistema" {...formik.getFieldProps('rol')}
                        disabled={isLoading || isSelfEditing} sx={{ ...INPUT_SX, flex: 1 }}
                    >
                        <MenuItem value="cliente">Cliente</MenuItem>
                        <MenuItem value="admin">Administrador</MenuItem>
                    </TextField>
                </Tooltip>

                <Tooltip title={isSelfEditing ? "No puedes desactivar tu propia cuenta aquí" : ""}>
                    <Box sx={{
                        p: 1, px: 2, border: '1px solid',
                        borderColor: isActive ? 'success.main' : 'error.main',
                        bgcolor: isActive ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05),
                        borderRadius: 2, flex: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        opacity: isSelfEditing ? 0.6 : 1,
                        cursor: isSelfEditing ? 'not-allowed' : 'default',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: isActive ? 'success.main' : 'error.main' }}>
                                {isActive ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight="bold" color={isActive ? 'success.dark' : 'error.dark'}>
                                    {isActive ? 'CUENTA HABILITADA' : 'CUENTA BLOQUEADA'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {isActive ? 'Acceso permitido' : 'Acceso denegado'}
                                </Typography>
                            </Box>
                        </Box>
                        <Switch checked={Boolean(isActive)} onChange={formik.handleChange} name="activo"
                            color={isActive ? 'success' : 'error'} disabled={isLoading || isSelfEditing}
                        />
                    </Box>
                </Tooltip>
            </Stack>

            {!isActive && !isSelfEditing && (
                <Alert severity="error" variant="filled" sx={{ mt: 2, borderRadius: 2 }}>
                    Al guardar, este usuario será desconectado inmediatamente.
                </Alert>
            )}
        </Box>
    );
};

export default PermissionsSection;