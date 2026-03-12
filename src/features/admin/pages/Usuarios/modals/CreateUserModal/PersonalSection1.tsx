// src/features/admin/pages/Usuarios/modals/sections/PersonalSection.tsx

import { BadgeOutlined as BadgeIcon } from '@mui/icons-material';
import { Stack, TextField } from '@mui/material';
import type { FormikProps } from 'formik';
import React from 'react';
import type { CreateUsuarioDto } from '@/core/types/dto/usuario.dto';
import SectionTitle from '../components/SectionTitle';

const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface Props {
  formik: FormikProps<CreateUsuarioDto>;
  isLoading: boolean;
  onNumericChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PersonalSection: React.FC<Props> = ({ formik, isLoading, onNumericChange }) => (
  <Stack spacing={2.5}>
    <SectionTitle icon={<BadgeIcon color="primary" fontSize="small" />}>Identidad y Contacto</SectionTitle>

    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField fullWidth label="Nombre" {...formik.getFieldProps('nombre')}
        error={formik.touched.nombre && Boolean(formik.errors.nombre)}
        helperText={formik.touched.nombre && formik.errors.nombre}
        disabled={isLoading} sx={INPUT_SX}
      />
      <TextField fullWidth label="Apellido" {...formik.getFieldProps('apellido')}
        error={formik.touched.apellido && Boolean(formik.errors.apellido)}
        helperText={formik.touched.apellido && formik.errors.apellido}
        disabled={isLoading} sx={INPUT_SX}
      />
    </Stack>

    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField fullWidth id="dni" name="dni" label="DNI (Sin puntos)"
        value={formik.values.dni} onChange={onNumericChange} onBlur={formik.handleBlur}
        error={formik.touched.dni && Boolean(formik.errors.dni)}
        helperText={formik.touched.dni && formik.errors.dni}
        disabled={isLoading} sx={INPUT_SX}
      />
      <TextField fullWidth id="numero_telefono" name="numero_telefono" label="Teléfono Celular"
        value={formik.values.numero_telefono} onChange={onNumericChange} onBlur={formik.handleBlur}
        error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
        helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
        disabled={isLoading} sx={INPUT_SX} placeholder="Ej: 1123456789"
      />
    </Stack>
  </Stack>
);

export default PersonalSection;