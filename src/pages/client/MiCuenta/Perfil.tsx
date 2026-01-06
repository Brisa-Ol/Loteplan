import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Alert, Snackbar,
  Divider, Avatar, Chip, Card, CardContent, alpha, useTheme, AlertTitle
} from '@mui/material';
import {
  Edit as EditIcon,
  DeleteForever as DeleteIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  VerifiedUser,
  Warning,
  Person,
  Phone,
  Email,
  AccountCircle,
  MoneyOff,
  Description,
  CameraAlt
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Servicios y Contexto
import { useAuth } from '../../../context/AuthContext';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import type { UpdateUserMeDto } from '../../../types/dto/usuario.dto';

// Hooks y Componentes
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import DeleteAccountModal from './components/DeleteAccountModal';
import SecuritySettings from './SecuritySettings';
import kycService from '../../../services/kyc.service';
import UsuarioService from '../../../services/usuario.service';

const Perfil: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // Hook de Confirmación
  const confirmController = useConfirmDialog();

  // Estados UI
  const [isEditing, setIsEditing] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // --- QUERIES ---
  const { data: kycStatus } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    retry: false
  });

  // ✅ MEJORADO: Usamos el endpoint validateDeactivation del backend
  // que centraliza la validación de bloqueos (deudas, inversiones pendientes, etc.)
  const { data: deactivationValidation, isLoading: loadingDeudas } = useQuery({
    queryKey: ['validateDeactivation'],
    queryFn: async () => (await UsuarioService.validateDeactivation()).data,
    retry: false
  });

  // ✅ El backend devuelve canDeactivate: false si hay bloqueos
  const deudaActiva = useMemo(() => {
    if (!deactivationValidation) return false;
    return !deactivationValidation.canDeactivate;
  }, [deactivationValidation]);

  // Warnings del backend para mostrar al usuario
  const deactivationWarnings = useMemo(() => {
    return deactivationValidation?.warnings || [];
  }, [deactivationValidation]);

  // --- MUTACIONES ---
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
    onError: (error: any) => setServerError(error.response?.data?.error || 'Error al actualizar el perfil.'),
  });

  // --- FORMIK ---
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
      // Unificamos validación con Register (mínimo 10 dígitos suele ser estándar para móviles con prefijo)
      numero_telefono: Yup.string().min(8, 'Número inválido').required('Requerido'),
    }),
    onSubmit: (values) => mutation.mutate(values),
    enableReinitialize: true,
  });

  const handleCancel = () => {
    formik.resetForm();
    setServerError(null);
    setIsEditing(false);
  };

  const getKycColor = (status?: string) => {
    switch (status) {
      case 'APROBADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  const handleDeleteClick = () => {
    confirmController.confirm('delete_account');
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>

        {/* === HEADER PROFILE === */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'visible',
            mt: 4,
            borderRadius: 4
          }}
        >
          <Box
            sx={{
              height: 140,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              borderRadius: '16px 16px 0 0',
              position: 'relative'
            }}
          />
          <CardContent sx={{ pt: 0, pb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', mt: -7, mb: 2 }}>
              <Avatar
                sx={{
                  width: 120, height: 120,
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  fontSize: '3rem',
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[3]
                }}
              >
                {user?.nombre?.charAt(0).toUpperCase()}
              </Avatar>
              {/* Botón flotante simulado (puedes activarlo en el futuro) */}
              <Box
                sx={{
                  position: 'absolute', bottom: 0, right: 0,
                  bgcolor: 'background.paper', borderRadius: '50%',
                  border: `1px solid ${theme.palette.divider}`,
                  p: 0.5, cursor: 'default', // Cambiar a 'pointer' si implementas subida
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <CameraAlt color="action" fontSize="small" />
              </Box>
            </Box>

            <Typography variant="h4" fontWeight={800} color="text.primary" textAlign="center">
              {user?.nombre} {user?.apellido}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom textAlign="center">
              @{user?.nombre_usuario}
            </Typography>

            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" justifyContent="center" gap={1}>
              <Chip
                label={user?.rol === 'admin' ? 'Administrador' : 'Cliente'}
                color="primary"
                size="small"
                variant="filled"
                sx={{ fontWeight: 700 }}
              />
              {user?.confirmado_email && (
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: '16px !important' }} />}
                  label="Verificado"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderColor: alpha(theme.palette.success.main, 0.3)
                  }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* === DATOS PERSONALES === */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={formik.handleSubmit}>
              {/* Header form */}
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
                    <Button variant="text" color="inherit" onClick={handleCancel} startIcon={<CloseIcon />}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={mutation.isPending || !formik.isValid} startIcon={<SaveIcon />}>Guardar</Button>
                  </Stack>
                )}
              </Box>

              <Divider sx={{ mb: 4 }} />

              {serverError && (
                <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>
              )}

              {/* Inputs con Grid CSS */}
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                <TextField
                  fullWidth label="Nombre" name="nombre"
                  value={formik.values.nombre} onChange={formik.handleChange}
                  disabled={!isEditing}
                  variant="outlined"
                />
                <TextField
                  fullWidth label="Apellido" name="apellido"
                  value={formik.values.apellido} onChange={formik.handleChange}
                  disabled={!isEditing}
                />

                {/* DNI full width (Read Only) */}
                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <TextField
                    fullWidth label="Documento de Identidad (DNI)"
                    value={user?.dni || ''} disabled
                    helperText="El DNI no puede modificarse por seguridad."
                  />
                </Box>

                <TextField
                  fullWidth label="Usuario" name="nombre_usuario"
                  value={formik.values.nombre_usuario} onChange={formik.handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <AccountCircle color="action" sx={{ mr: 1 }} />
                  }}
                />
                <TextField
                  fullWidth label="Email" name="email"
                  value={formik.values.email} onChange={formik.handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Email color="action" sx={{ mr: 1 }} />
                  }}
                />

                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <TextField
                    fullWidth label="Teléfono" name="numero_telefono"
                    value={formik.values.numero_telefono}
                    // Permitir solo números en la edición
                    onChange={(e) => formik.setFieldValue('numero_telefono', e.target.value.replace(/\D/g, ''))}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Phone color="action" sx={{ mr: 1 }} />
                    }}
                  />
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* === KYC STATUS === */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: kycStatus?.estado_verificacion === 'APROBADA'
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.warning.main, 0.1),
                    color: kycStatus?.estado_verificacion === 'APROBADA'
                      ? 'success.main'
                      : 'warning.main',
                    width: 56, height: 56
                  }}
                >
                  <BadgeIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Verificación de Identidad</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Typography variant="body2" color="text.secondary">Estado actual:</Typography>
                    <Chip
                      label={kycStatus?.estado_verificacion || 'NO INICIADO'}
                      color={getKycColor(kycStatus?.estado_verificacion) as any}
                      size="small"
                      variant="filled"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Box>
              </Stack>

              {kycStatus?.estado_verificacion !== 'APROBADA' ? (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => navigate('/kyc')}
                  sx={{ minWidth: 160, borderRadius: 2 }}
                  disableElevation
                >
                  {kycStatus?.estado_verificacion === 'PENDIENTE' ? 'Ver Estado' : 'Iniciar KYC'}
                </Button>
              ) : (
                <Box
                  display="flex" alignItems="center" gap={1}
                  sx={{
                    color: 'success.main',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    px: 2, py: 1, borderRadius: 2
                  }}
                >
                  <VerifiedUser />
                  <Typography variant="body2" fontWeight={700}>Identidad Verificada</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* === SEGURIDAD === */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 56, height: 56
                  }}
                >
                  <SecurityIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Seguridad de la Cuenta</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.is_2fa_enabled
                      ? 'Autenticación de dos factores (2FA) activada.'
                      : 'Protege tu cuenta activando la verificación en dos pasos.'}
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowSecuritySection(!showSecuritySection)}
                sx={{ minWidth: 140, borderRadius: 2 }}
              >
                {showSecuritySection ? 'Ocultar' : 'Configurar'}
              </Button>
            </Stack>

            {showSecuritySection && (
              <Box mt={4}>
                <Divider sx={{ mb: 4 }} />
                <SecuritySettings />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* === ZONA DE PELIGRO === */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${deudaActiva ? theme.palette.warning.light : theme.palette.error.light}`,
            bgcolor: deudaActiva ? alpha(theme.palette.warning.main, 0.02) : alpha(theme.palette.error.main, 0.02),
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="error.main">Zona de Peligro</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Acciones irreversibles sobre tu cuenta.
                  </Typography>
                </Box>
              </Stack>

              {deudaActiva ? (
                <Alert
                  severity="warning"
                  icon={<MoneyOff fontSize="inherit" />}
                  variant="outlined"
                  sx={{
                    border: `1px solid ${theme.palette.warning.main}`,
                    bgcolor: 'background.paper',
                    borderRadius: 2
                  }}
                >
                  <AlertTitle fontWeight={700}>Acción Bloqueada</AlertTitle>
                  {/* ✅ Mostramos los warnings dinámicos del backend */}
                  {deactivationWarnings.length > 0 ? (
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {deactivationWarnings.map((warning, idx) => (
                        <Typography component="li" variant="body2" key={idx}>
                          {warning}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" paragraph>
                      No puedes desactivar tu cuenta. Debes regularizar tu situación primero.
                    </Typography>
                  )}
                  <Button size="small" color="warning" variant="contained" onClick={() => navigate('/client/suscripciones')} sx={{ fontWeight: 700, borderRadius: 2 }}>
                    Ir a Mis Suscripciones
                  </Button>
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  icon={<Description fontSize="inherit" />}
                  variant="outlined"
                  sx={{
                    border: `1px solid ${theme.palette.info.main}`,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2
                  }}
                >
                  <AlertTitle fontWeight={700}>Importante: Respalda tu información</AlertTitle>
                  <Typography variant="body2" paragraph>
                    Al desactivar tu cuenta, <strong>perderás el acceso a la plataforma</strong> y no podrás descargar tus contratos firmados posteriormente. Te recomendamos descargarlos ahora.
                  </Typography>
                  <Button size="small" color="info" variant="contained" onClick={() => navigate('/client/contratos')} sx={{ fontWeight: 700, borderRadius: 2 }} disableElevation>
                    Ir a Mis Documentos
                  </Button>
                </Alert>
              )}

              <Box display="flex" justifyContent="flex-end" pt={1}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                  disabled={deudaActiva || loadingDeudas}
                  disableElevation
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Desactivar Cuenta
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

      </Stack>

      <Snackbar open={successOpen} autoHideDuration={3000} onClose={() => setSuccessOpen(false)}>
        <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          ¡Perfil actualizado correctamente!
        </Alert>
      </Snackbar>

      {/* Modal conectado al hook */}
      <DeleteAccountModal
        open={confirmController.open}
        onClose={confirmController.close}
        is2FAEnabled={user?.is_2fa_enabled || false}
      // El hook por defecto tiene textos genéricos, pero deleteAccountModal se encarga de mostrar el detalle
      />

    </PageContainer>
  );
};

export default Perfil;