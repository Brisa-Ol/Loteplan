import React, { useState } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Alert, Snackbar,
  Divider, Paper, Avatar, Chip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  DeleteForever as DeleteIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Servicios y Contexto
import { useAuth } from '../../../context/AuthContext';
import type { UpdateUserMeDto } from '../../../types/dto/usuario.dto';
import UsuarioService from '../../../Services/usuario.service';
import kycService from '../../../Services/kyc.service';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';

// Hooks
import { useModal } from '../../../hooks/useModal'; // 👈 Importamos el hook

// Componentes
import DeleteAccountModal from './components/DeleteAccountModal';
import SecuritySettings from './SecuritySettings';

const Perfil: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  
  // 1. Hook para el Modal de Eliminar Cuenta
  const deleteAccountModal = useModal(); 

  // UI States (Estos se quedan igual)
  const [isEditing, setIsEditing] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  
  // Feedback States
  const [successOpen, setSuccessOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch KYC Status
  const { data: kycStatus } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    retry: false
  });

  // Profile Update Mutation
  const mutation = useMutation({
    mutationFn: async (data: UpdateUserMeDto) => {
      const response = await UsuarioService.updateMe(data);
      return response.data;
    },
    onSuccess: async () => {
      await refetchUser();
      setIsEditing(false);
      setSuccessOpen(true);
      setServerError(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al actualizar el perfil.';
      setServerError(msg);
    },
  });

  const formik = useFormik<UpdateUserMeDto>({
    initialValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      numero_telefono: user?.numero_telefono || '',
      nombre_usuario: user?.nombre_usuario || '',
    },
    validationSchema: Yup.object({
      nombre: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
      apellido: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
      email: Yup.string().email('Email inválido').required('Requerido'),
      nombre_usuario: Yup.string().min(4, 'Mínimo 4 caracteres').required('Requerido'),
      numero_telefono: Yup.string().min(8, 'Número muy corto').required('Requerido'),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
    enableReinitialize: true,
  });

  const handleCancel = () => {
    formik.resetForm();
    setServerError(null);
    setIsEditing(false);
  };

  const getKycColor = (status?: string) => {
    switch(status) {
      case 'APROBADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>

        {/* Header */}
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
          <Avatar
            sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
          >
            {user?.nombre?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h3" fontWeight="bold">
            {user?.nombre} {user?.apellido}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            @{user?.nombre_usuario}
          </Typography>
          <Chip 
            label={user?.rol === 'admin' ? 'Administrador' : 'Cliente'} 
            color="primary" size="small" variant="outlined" sx={{ mt: 1 }}
          />
        </Box>

        {/* === SECTION 1: PERSONAL INFORMATION === */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}

          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color="primary">Datos Personales</Typography>
                {!isEditing ? (
                  <Button variant="text" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>Editar</Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" color="inherit" size="small" onClick={handleCancel}>Cancelar</Button>
                    <Button type="submit" variant="contained" size="small" disabled={mutation.isPending || !formik.isValid}>
                      {mutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </Stack>
                )}
              </Box>
              <Divider />

              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth label="Nombre" name="nombre"
                  value={formik.values.nombre} onChange={formik.handleChange}
                  disabled={!isEditing} variant={isEditing ? "outlined" : "filled"}
                />
                <TextField
                  fullWidth label="Apellido" name="apellido"
                  value={formik.values.apellido} onChange={formik.handleChange}
                  disabled={!isEditing} variant={isEditing ? "outlined" : "filled"}
                />
              </Box>

              <TextField
                fullWidth label="DNI / Identificación" value={user?.dni || ''} disabled variant="filled"
                helperText="Este campo no se puede modificar por seguridad."
              />

              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth label="Nombre de Usuario" name="nombre_usuario"
                  value={formik.values.nombre_usuario} onChange={formik.handleChange}
                  disabled={!isEditing} variant={isEditing ? "outlined" : "filled"}
                />
                <TextField
                  fullWidth label="Email" name="email"
                  value={formik.values.email} onChange={formik.handleChange}
                  disabled={!isEditing} variant={isEditing ? "outlined" : "filled"}
                />
              </Box>

              <TextField
                fullWidth label="Teléfono" name="numero_telefono"
                value={formik.values.numero_telefono} onChange={formik.handleChange}
                disabled={!isEditing} variant={isEditing ? "outlined" : "filled"}
              />
            </Stack>
          </form>
        </Paper>

        {/* === SECTION 2: IDENTITY VERIFICATION (KYC) === */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <BadgeIcon color="primary" />
              <Typography variant="h6">Verificación de Identidad</Typography>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Estado: <Chip label={kycStatus?.estado_verificacion || 'NO INICIADO'} color={getKycColor(kycStatus?.estado_verificacion)} size="small" />
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {kycStatus?.estado_verificacion === 'APROBADA' 
                    ? 'Tu identidad ha sido verificada. Tienes acceso completo.'
                    : 'Es necesario verificar tu identidad para operar.'}
                </Typography>
              </Box>
              {kycStatus?.estado_verificacion !== 'APROBADA' && (
                <Button variant="outlined" onClick={() => navigate('/kyc')}>
                  {kycStatus?.estado_verificacion === 'PENDIENTE' ? 'Ver Estado' : 'Iniciar Verificación'}
                </Button>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* === SECTION 3: SECURITY (2FA) === */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Seguridad</Typography>
              </Box>
              <Button onClick={() => setShowSecuritySection(!showSecuritySection)}>
                {showSecuritySection ? 'Ocultar' : 'Gestionar'}
              </Button>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Autenticación de Dos Factores (2FA)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.is_2fa_enabled ? 'Activado. Tu cuenta está protegida.' : 'Desactivado. Recomendamos activarlo.'}
                </Typography>
              </Box>
              <Chip label={user?.is_2fa_enabled ? 'ACTIVO' : 'INACTIVO'} color={user?.is_2fa_enabled ? 'success' : 'default'} />
            </Box>
            
            {showSecuritySection && (
              <Box mt={2}>
                <SecuritySettings />
              </Box>
            )}
          </Stack>
        </Paper>

        {/* === SECTION 4: DANGER ZONE === */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.lighter' }}>
          <Stack spacing={2}>
            <Typography variant="h6" color="error">Zona de Peligro</Typography>
            <Divider sx={{ borderColor: 'error.light' }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Desactivar Cuenta</Typography>
                <Typography variant="body2" color="text.secondary">
                  Esto desactivará tu acceso y ocultará tu perfil. Podrás reactivarlo contactando a soporte.
                </Typography>
              </Box>
              <Button 
                variant="contained" color="error" startIcon={<DeleteIcon />}
                onClick={deleteAccountModal.open} // 👈 Usamos el hook
              >
                Desactivar Cuenta
              </Button>
            </Box>
          </Stack>
        </Paper>

      </Stack>

      <Snackbar
        open={successOpen} autoHideDuration={3000} onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled">
          ¡Perfil actualizado correctamente!
        </Alert>  
      </Snackbar>

      {/* Delete Account Modal (Controlado por Hook) */}
      <DeleteAccountModal 
        open={deleteAccountModal.isOpen} 
        onClose={deleteAccountModal.close} 
        is2FAEnabled={user?.is_2fa_enabled || false}
      />

    </PageContainer>
  );
};

export default Perfil;