// src/features/admin/pages/Usuarios/modals/sections/RoleSection.tsx

import type { CreateUsuarioDto } from '@/core/types/usuario.dto';
import { AdminPanelSettingsOutlined as RoleIcon } from '@mui/icons-material';
import { Alert, MenuItem, Stack, TextField } from '@mui/material';
import type { FormikProps } from 'formik';
import React from 'react';
import SectionTitle from '../components/SectionTitle';

const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface Props {
    formik: FormikProps<CreateUsuarioDto>;
    isLoading: boolean;
}

const RoleSection: React.FC<Props> = ({ formik, isLoading }) => (
    <Stack spacing={2}>
        <SectionTitle icon={<RoleIcon color="primary" fontSize="small" />}>Permisos del Sistema</SectionTitle>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select fullWidth label="Rol Asignado" {...formik.getFieldProps('rol')}
                disabled={isLoading} sx={{ ...INPUT_SX, flex: 1 }}
            >
                <MenuItem value="cliente">Cliente</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
            </TextField>

            <Alert severity="info" variant="outlined" sx={{ flex: 1.2, alignItems: 'center', borderRadius: 2 }}>
                El nuevo usuario deberá ser <b>activado manualmente</b> por un administrador.
            </Alert>
        </Stack>
    </Stack>
);

export default RoleSection;