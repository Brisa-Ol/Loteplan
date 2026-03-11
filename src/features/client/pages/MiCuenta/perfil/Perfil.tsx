import {
  AccountCircle,
  Badge as BadgeIcon,
  CameraAlt,
  Close as CloseIcon,
  DeleteForever as DeleteIcon,
  Edit as EditIcon,
  Email,
  ExpandLess,
  ExpandMore,
  Key,
  Lock,
  MoneyOff,
  Person,
  Phone,
  Save as SaveIcon,
  Security as SecurityIcon,
  VerifiedUser,
  Visibility,
  VisibilityOff,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Card, CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Stack, TextField,
  Typography,
  alpha, useTheme
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFormik } from 'formik';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

import { PageContainer } from '../../../../../shared/components/layout/PageContainer';

import kycService from '@/core/api/services/kyc.service';
import UsuarioService from '@/core/api/services/usuario.service';
import { useAuth } from '@/core/context/AuthContext';
import type { ChangePasswordDto, UpdateUserMeDto } from '@/core/types/dto/usuario.dto';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useConfirmDialog } from '../../../../../shared/hooks/useConfirmDialog';
import SecuritySettings from '../SecuritySettings';
import DeleteAccountModal from './modal/DeleteAccountModal';


// ─────────────────────────────────────────────
// SUB-COMPONENTE: ProfileHeader
// ─────────────────────────────────────────────

const ProfileHeader = ({ user, theme }: { user: any; theme: any }) => (
  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, overflow: 'visible', mt: 4, borderRadius: 4 }}>
    <Box
      sx={{
        height: 140,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        borderRadius: '16px 16px 0 0',
      }}
    />
    <CardContent sx={{ pt: 0, pb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', mt: -7, mb: 2 }}>
        <Avatar
          sx={{
            width: 120, height: 120,
            bgcolor: 'background.paper', color: 'primary.main', fontSize: '3rem',
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[3],
          }}
        >
          {user?.nombre?.charAt(0).toUpperCase()}
        </Avatar>
        <Box
          sx={{
            position: 'absolute', bottom: 0, right: 0,
            bgcolor: 'background.paper', borderRadius: '50%',
            border: `1px solid ${theme.palette.divider}`,
            p: 0.5, cursor: 'default',
            '&:hover': { bgcolor: 'action.hover' },
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
          color="primary" size="small" variant="filled"
          sx={{ fontWeight: 700 }}
        />
        {user?.confirmado_email && (
          <Chip
            icon={<VerifiedUser sx={{ fontSize: '16px !important' }} />}
            label="Verificado" color="success" size="small" variant="outlined"
            sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05), borderColor: alpha(theme.palette.success.main, 0.3) }}
          />
        )}
      </Stack>
    </CardContent>
  </Card>
);


// ─────────────────────────────────────────────
// SUB-COMPONENTE: PersonalDataForm
// Incluye sección de cambio de contraseña integrada
// ─────────────────────────────────────────────

const PersonalDataForm = ({ user, isEditing, setIsEditing, onSubmit, isLoading, theme }: any) => {
  const { showSuccess } = useSnackbar();

  // — Estado sección contraseña —
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordApiError, setPasswordApiError] = useState<string | null>(null);

  // — Estado modal 2FA —
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [pendingPasswordPayload, setPendingPasswordPayload] = useState<Omit<ChangePasswordDto, 'twofaCode'> | null>(null);

  // — Formik datos personales —
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
      numero_telefono: Yup.string().min(8, 'Número inválido').required('Requerido'),
    }),
    onSubmit,
    enableReinitialize: true,
  });

  // — Formik contraseña —
  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Requerido'),
      newPassword: Yup.string()
        .min(8, 'Mínimo 8 caracteres')
        .matches(/[A-Z]/, 'Al menos una mayúscula')
        .matches(/[0-9]/, 'Al menos un número')
        .required('Requerido'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden')
        .required('Requerido'),
    }),
    onSubmit: (values) => {
      setPasswordApiError(null);
      const payload = { currentPassword: values.currentPassword, newPassword: values.newPassword };

      if (user?.is_2fa_enabled) {
        setPendingPasswordPayload(payload);
        setTwoFaError(null);
        setTwoFaModalOpen(true);
      } else {
        passwordMutation.mutate(payload);
      }
    },
  });

  // — Mutation cambio de contraseña —
  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => UsuarioService.changePassword(data),
    onSuccess: () => {
      showSuccess('Contraseña actualizada correctamente');
      handleClosePasswordSection();
    },
    onError: (error: any) => {
      setPasswordApiError(error?.response?.data?.error || error?.message || 'Error al cambiar la contraseña');
    },
  });

  // — Confirmar con código 2FA —
  const handleTwoFaSubmit = async (code: string) => {
    if (!pendingPasswordPayload) return;
    setTwoFaLoading(true);
    setTwoFaError(null);
    try {
      await UsuarioService.changePassword({ ...pendingPasswordPayload, twofaCode: code });
      setTwoFaModalOpen(false);
      setPendingPasswordPayload(null);
      showSuccess('Contraseña actualizada correctamente');
      handleClosePasswordSection();
    } catch (error: any) {
      setTwoFaError(error?.response?.data?.error || 'Código 2FA incorrecto');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleClosePasswordSection = () => {
    setShowPasswordSection(false);
    passwordFormik.resetForm();
    setPasswordApiError(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleCancel = () => {
    formik.resetForm();
    setIsEditing(false);
  };

  return (
    <>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={formik.handleSubmit}>

            {/* — Header — */}
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
                  <Button
                    type="submit" variant="contained"
                    disabled={isLoading || !formik.isValid}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Guardar
                  </Button>
                </Stack>
              )}
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* — Grid de campos — */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>

              <TextField
                fullWidth label="Nombre" name="nombre"
                value={formik.values.nombre} onChange={formik.handleChange}
                disabled={!isEditing}
                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                helperText={formik.touched.nombre && formik.errors.nombre}
              />
              <TextField
                fullWidth label="Apellido" name="apellido"
                value={formik.values.apellido} onChange={formik.handleChange}
                disabled={!isEditing}
                error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                helperText={formik.touched.apellido && formik.errors.apellido}
              />

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
                InputProps={{ startAdornment: <AccountCircle color="action" sx={{ mr: 1 }} /> }}
                error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
              />
              <TextField
                fullWidth label="Email" name="email"
                value={formik.values.email} onChange={formik.handleChange}
                disabled={!isEditing}
                InputProps={{ startAdornment: <Email color="action" sx={{ mr: 1 }} /> }}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />

              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <TextField
                  fullWidth label="Teléfono" name="numero_telefono"
                  value={formik.values.numero_telefono}
                  onChange={(e) => formik.setFieldValue('numero_telefono', e.target.value.replace(/\D/g, ''))}
                  disabled={!isEditing}
                  InputProps={{ startAdornment: <Phone color="action" sx={{ mr: 1 }} /> }}
                  error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                  helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                />
              </Box>

              {/* ── Sección cambio de contraseña ── */}
              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <Divider sx={{ mb: 3 }}>
                  <Button
                    variant="text"
                    color="warning"
                    size="small"
                    startIcon={<Key fontSize="small" />}
                    endIcon={showPasswordSection ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    onClick={() => showPasswordSection ? handleClosePasswordSection() : setShowPasswordSection(true)}
                    sx={{ fontWeight: 600, px: 2 }}
                  >
                    {showPasswordSection ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                  </Button>
                </Divider>

                <Collapse in={showPasswordSection} unmountOnExit>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: alpha(theme.palette.warning.main, 0.03),
                      border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
                      borderRadius: 2,
                    }}
                  >
                    <Stack spacing={2.5}>
                      {passwordApiError && (
                        <Alert
                          severity="error"
                          action={
                            <IconButton size="small" onClick={() => setPasswordApiError(null)}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          {passwordApiError}
                        </Alert>
                      )}

                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={2}>
                        {/* Contraseña actual */}
                        <TextField
                          fullWidth label="Contraseña actual"
                          name="currentPassword"
                          type={showCurrent ? 'text' : 'password'}
                          value={passwordFormik.values.currentPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                          error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                          helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                          InputProps={{
                            startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small">
                                  {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />

                        {/* Nueva contraseña */}
                        <TextField
                          fullWidth label="Nueva contraseña"
                          name="newPassword"
                          type={showNew ? 'text' : 'password'}
                          value={passwordFormik.values.newPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                          error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                          helperText={
                            (passwordFormik.touched.newPassword && passwordFormik.errors.newPassword) ||
                            'Mín. 8 caracteres, 1 mayúscula y 1 número'
                          }
                          InputProps={{
                            startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowNew(!showNew)} edge="end" size="small">
                                  {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />

                        {/* Confirmar contraseña */}
                        <TextField
                          fullWidth label="Confirmar contraseña"
                          name="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          value={passwordFormik.values.confirmPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                          error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                          helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                          InputProps={{
                            startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                                  {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>

                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          color="warning"
                          disabled={passwordMutation.isPending || !passwordFormik.isValid || !passwordFormik.dirty}
                          startIcon={
                            passwordMutation.isPending
                              ? <CircularProgress size={18} color="inherit" />
                              : <SaveIcon />
                          }
                          onClick={() => passwordFormik.handleSubmit()}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          {user?.is_2fa_enabled ? 'Continuar con 2FA' : 'Guardar contraseña'}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </Collapse>
              </Box>

            </Box>
          </form>
        </CardContent>
      </Card>

      {/* — Modal 2FA para confirmar cambio de contraseña — */}
      <TwoFactorAuthModal
        open={twoFaModalOpen}
        onClose={() => { setTwoFaModalOpen(false); setTwoFaError(null); }}
        onSubmit={handleTwoFaSubmit}
        isLoading={twoFaLoading}
        error={twoFaError}
        title="Confirmar cambio de contraseña"
        description="Ingresá el código de tu autenticador para confirmar el cambio de contraseña."
      />
    </>
  );
};


// ─────────────────────────────────────────────
// SUB-COMPONENTE: KycStatusCard
// ─────────────────────────────────────────────

const KycStatusCard = ({ kycStatus, navigate, theme }: any) => {
  const getKycColor = (status?: string) => {
    switch (status) {
      case 'APROBADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  return (
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
                color: kycStatus?.estado_verificacion === 'APROBADA' ? 'success.main' : 'warning.main',
                width: 56, height: 56,
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
                  size="small" variant="filled"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>
          </Stack>

          {kycStatus?.estado_verificacion !== 'APROBADA' ? (
            <Button
              variant="contained" color="warning"
              onClick={() => navigate('/client/kyc')}
              sx={{ minWidth: 160, borderRadius: 2 }}
              disableElevation
            >
              {kycStatus?.estado_verificacion === 'PENDIENTE' ? 'Ver Estado' : 'Iniciar KYC'}
            </Button>
          ) : (
            <Box
              display="flex" alignItems="center" gap={1}
              sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1), px: 2, py: 1, borderRadius: 2 }}
            >
              <VerifiedUser />
              <Typography variant="body2" fontWeight={700}>Identidad Verificada</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};


// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL: Perfil
// ─────────────────────────────────────────────

const Perfil: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess } = useSnackbar();
  const confirmController = useConfirmDialog();

  const [isEditing, setIsEditing] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [showDeactivationBlock, setShowDeactivationBlock] = useState(false);

  const { data: kycStatus } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: async () => await kycService.getStatus(),
    retry: false,
  });

  const { data: deactivationValidation, isLoading: loadingDeudas } = useQuery({
    queryKey: ['validateDeactivation'],
    queryFn: async () => (await UsuarioService.validateDeactivation()).data,
    retry: false,
  });

  const hasBlockers = useMemo(() => !deactivationValidation?.canDeactivate, [deactivationValidation]);
  const deactivationWarnings = useMemo(() => deactivationValidation?.warnings || [], [deactivationValidation]);

  const mutation = useMutation({
    mutationFn: async (data: UpdateUserMeDto) => {
      const response = await UsuarioService.updateMe(data);
      return response.data;
    },
    onSuccess: async () => {
      await refetchUser();
      setIsEditing(false);
      showSuccess('Perfil actualizado correctamente');
    },
  });

  const handleDeleteClick = () => {
    setShowDeactivationBlock(false);
    if (hasBlockers) {
      setShowDeactivationBlock(true);
    } else {
      confirmController.confirm('delete_account');
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>

        <ProfileHeader user={user} theme={theme} />

        <PersonalDataForm
          user={user}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSubmit={(val: UpdateUserMeDto) => mutation.mutate(val)}
          isLoading={mutation.isPending}
          theme={theme}
        />

        <KycStatusCard kycStatus={kycStatus} navigate={navigate} theme={theme} />

        {/* ── Seguridad / 2FA ── */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}
                >
                  <SecurityIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Verificación de 2 factores</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Typography variant="body2" color="text.secondary">Estado actual:</Typography>
                    <Chip
                      label={user?.is_2fa_enabled ? 'ACTIVO' : 'INACTIVO'}
                      color={user?.is_2fa_enabled ? 'success' : 'warning'}
                      size="small" variant="filled"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Box>
              </Stack>
              <Button
                variant="outlined" color="primary"
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

        {/* ── Zona de Peligro ── */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.error.light}`,
            bgcolor: alpha(theme.palette.error.main, 0.02),
            borderRadius: 3,
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

              {/* Solo aparece si intentó desactivar y tiene bloqueantes */}
              {showDeactivationBlock && (
                <Alert
                  severity="warning"
                  icon={<MoneyOff fontSize="inherit" />}
                  variant="outlined"
                  sx={{ border: `1px solid ${theme.palette.warning.main}`, bgcolor: 'background.paper', borderRadius: 2 }}
                >
                  <AlertTitle fontWeight={700}>Acción Bloqueada</AlertTitle>
                  {deactivationWarnings.length > 0 ? (
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {deactivationWarnings.map((warning: string, idx: number) => (
                        <Typography component="li" variant="body2" key={idx}>{warning}</Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" paragraph>
                      No puedes desactivar tu cuenta. Debes regularizar tu situación financiera primero.
                    </Typography>
                  )}
                  <Button
                    size="small" color="warning" variant="contained"
                    onClick={() => navigate('/client/finanzas/suscripciones')}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  >
                    Ir a Mis Suscripciones
                  </Button>
                </Alert>
              )}

              <Box display="flex" justifyContent="flex-end" pt={1}>
                <Button
                  variant="contained" color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                  disabled={loadingDeudas}
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

      <DeleteAccountModal
        open={confirmController.open}
        onClose={confirmController.close}
        is2FAEnabled={user?.is_2fa_enabled || false}
      />
    </PageContainer>
  );
};

export default Perfil;