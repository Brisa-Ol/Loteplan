// src/pages/client/MiCuenta/Perfil/components/PersonalDataForm.tsx

import { useAuth } from '@/core/context/AuthContext';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import { AccountCircle, Close as CloseIcon, Edit as EditIcon, Email, Person, Phone, Save as SaveIcon } from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Card, CardContent,
  CircularProgress, Divider, Stack, TextField, Typography, useTheme
} from '@mui/material';
import React from 'react';
import type { usePasswordChange } from '../hooks/usePasswordChange';
import type { useProfileForm } from '../hooks/useProfileForm';
import PasswordSection from './PasswordSection';

interface Props {
  profileHook:  ReturnType<typeof useProfileForm>;
  passwordHook: ReturnType<typeof usePasswordChange>;
}

const PersonalDataForm: React.FC<Props> = ({ profileHook: p, passwordHook: pw }) => {
  const { user } = useAuth();
  const theme    = useTheme();
  const { formik, isEditing, setIsEditing, cancel, isLoading } = p;

  return (
    <>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={formik.handleSubmit}>

            {/* HEADER */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>Datos Personales</Typography>
              </Stack>
              {!isEditing ? (
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>Editar</Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button variant="text" color="inherit" onClick={cancel} startIcon={<CloseIcon />}>Cancelar</Button>
                  <Button type="submit" variant="contained"
                    disabled={isLoading || !formik.isValid || !formik.dirty}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}>
                    Guardar
                  </Button>
                </Stack>
              )}
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* CAMPOS */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>

              {[
                { name: 'nombre',   label: 'Nombre' },
                { name: 'apellido', label: 'Apellido' },
              ].map(({ name, label }) => (
                <TextField key={name} fullWidth label={label} name={name}
                  value={(formik.values as any)[name]} onChange={formik.handleChange}
                  disabled={!isEditing}
                  error={(formik.touched as any)[name] && Boolean((formik.errors as any)[name])}
                  helperText={(formik.touched as any)[name] && (formik.errors as any)[name]}
                />
              ))}

              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <TextField fullWidth label="Documento de Identidad (DNI)"
                  value={user?.dni || ''} disabled
                  helperText="El DNI no puede modificarse por seguridad." />
              </Box>

              <TextField fullWidth label="Usuario" name="nombre_usuario"
                value={formik.values.nombre_usuario} onChange={formik.handleChange}
                disabled={!isEditing}
                InputProps={{ startAdornment: <AccountCircle color="action" sx={{ mr: 1 }} /> }}
                error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
              />
              <TextField fullWidth label="Email" name="email"
                value={formik.values.email} onChange={formik.handleChange}
                disabled={!isEditing}
                InputProps={{ startAdornment: <Email color="action" sx={{ mr: 1 }} /> }}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />

              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <TextField fullWidth label="Teléfono" name="numero_telefono"
                  value={formik.values.numero_telefono}
                  onChange={(e) => formik.setFieldValue('numero_telefono', e.target.value.replace(/\D/g, ''))}
                  disabled={!isEditing}
                  InputProps={{ startAdornment: <Phone color="action" sx={{ mr: 1 }} /> }}
                  error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                  helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                />
              </Box>

              <PasswordSection passwordHook={pw} />

            </Box>
          </form>
        </CardContent>
      </Card>

      <TwoFactorAuthModal
        open={pw.twoFaOpen}
        onClose={() => { pw.setTwoFaOpen(false); pw.setTwoFaError(null); pw.setPendingPayload(null); }}
        onSubmit={pw.handleTwoFaSubmit}
        isLoading={pw.twoFaLoading}
        error={pw.twoFaError}
        title="Confirmar cambio de contraseña"
        description="Ingresá el código de tu autenticador para confirmar el cambio de contraseña."
      />
    </>
  );
};

export default PersonalDataForm;