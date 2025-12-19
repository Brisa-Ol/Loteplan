import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Alert, Snackbar,
  Divider, Avatar, Chip, Card, CardContent, alpha, useTheme, AlertTitle
} from '@mui/material';
// ... tus imports de iconos (EditIcon, DeleteIcon, etc.)
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
  Description 
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Servicios
import { useAuth } from '../../../context/AuthContext';
import UsuarioService from '../../../Services/usuario.service';
import kycService from '../../../Services/kyc.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import type { UpdateUserMeDto } from '../../../types/dto/usuario.dto';

// 🟢 1. Importamos el Hook de Confirmación
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';

// Componentes
import DeleteAccountModal from './components/DeleteAccountModal';
import SecuritySettings from './SecuritySettings';

const Perfil: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // 🟢 2. Instanciamos el Hook (reemplaza a useModal)
  const confirmController = useConfirmDialog();

  // Estados UI y Formulario
  const [isEditing, setIsEditing] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // --- QUERIES ---
  const { data: kycStatus } = useQuery({ queryKey: ['kycStatus'], queryFn: kycService.getStatus, retry: false });
  const { data: suscripciones, isLoading: loadingDeudas } = useQuery({ 
    queryKey: ['misSuscripcionesCheck'], 
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data, 
    retry: false 
  });

  const deudaActiva = useMemo(() => {
    if (!suscripciones) return false;
    return suscripciones.some(s => s.activo && s.meses_a_pagar > 0);
  }, [suscripciones]);

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
      nombre: Yup.string().min(2, 'Mínimo 2').required('Requerido'),
      apellido: Yup.string().min(2, 'Mínimo 2').required('Requerido'),
      email: Yup.string().email('Inválido').required('Requerido'),
      nombre_usuario: Yup.string().min(4, 'Mínimo 4').required('Requerido'),
      numero_telefono: Yup.string().min(8, 'Muy corto').required('Requerido'),
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
    switch(status) {
      case 'APROBADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  // 🟢 3. Handler para abrir el diálogo usando el hook
  const handleDeleteClick = () => {
    confirmController.confirm('delete_account');
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>
        
        {/* ... (HEADER, DATOS PERSONALES, KYC, SEGURIDAD - IGUAL QUE ANTES) ... */}
        {/* Aquí va todo el código de las secciones anteriores, no cambia nada visualmente */}
        
        {/* HEADER CARD */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.secondary.dark}`, overflow: 'visible', mt: 4 }}>
           {/* ... contenido del header ... */}
           {/* Para ahorrar espacio aquí, asumo que mantienes el código del header que te pasé antes */}
           <Box sx={{ height: 120, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, borderRadius: '12px 12px 0 0' }} />
           <CardContent sx={{ pt: 0, pb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <Avatar sx={{ width: 100, height: 100, mt: -6, mb: 2, bgcolor: 'background.default', color: 'primary.main', fontSize: '2.5rem', border: `4px solid ${theme.palette.background.default}`, boxShadow: 2 }}>{user?.nombre?.charAt(0).toUpperCase()}</Avatar>
             <Typography variant="h4" fontWeight={800} color="text.primary">{user?.nombre} {user?.apellido}</Typography>
             <Typography variant="body1" color="text.secondary" gutterBottom>@{user?.nombre_usuario}</Typography>
             <Stack direction="row" spacing={1} mt={1}>
                <Chip label={user?.rol === 'admin' ? 'Administrador' : 'Cliente'} color="primary" size="small" variant="outlined" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }} />
                {user?.confirmado_email && <Chip icon={<VerifiedUser fontSize="small" />} label="Email Verificado" color="success" size="small" variant="outlined" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05) }} />}
             </Stack>
           </CardContent>
        </Card>

        {/* DATOS PERSONALES */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.secondary.dark}` }}>
           <CardContent sx={{ p: 4 }}>
             {/* ... formulario formik ... */}
             <form onSubmit={formik.handleSubmit}>
               {/* Header form */}
               <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                 <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Person /></Avatar>
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
               <Divider sx={{ mb: 3 }} />
               {/* Inputs */}
               <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                 <TextField fullWidth label="Nombre" name="nombre" value={formik.values.nombre} onChange={formik.handleChange} disabled={!isEditing} variant="outlined" InputProps={{ readOnly: !isEditing }} />
                 <TextField fullWidth label="Apellido" name="apellido" value={formik.values.apellido} onChange={formik.handleChange} disabled={!isEditing} variant="outlined" InputProps={{ readOnly: !isEditing }} />
                 <Box sx={{ gridColumn: '1 / -1' }}>
                    <TextField fullWidth label="DNI" value={user?.dni || ''} disabled sx={{ bgcolor: 'action.hover', borderRadius: 1 }} />
                 </Box>
                 <TextField fullWidth label="Usuario" name="nombre_usuario" value={formik.values.nombre_usuario} onChange={formik.handleChange} disabled={!isEditing} variant="outlined" InputProps={{ readOnly: !isEditing, startAdornment: <AccountCircle color="action" sx={{ mr: 1 }} /> }} />
                 <TextField fullWidth label="Email" name="email" value={formik.values.email} onChange={formik.handleChange} disabled={!isEditing} variant="outlined" InputProps={{ readOnly: !isEditing, startAdornment: <Email color="action" sx={{ mr: 1 }} /> }} />
                 <Box sx={{ gridColumn: '1 / -1' }}>
                   <TextField fullWidth label="Teléfono" name="numero_telefono" value={formik.values.numero_telefono} onChange={formik.handleChange} disabled={!isEditing} variant="outlined" InputProps={{ readOnly: !isEditing, startAdornment: <Phone color="action" sx={{ mr: 1 }} /> }} />
                 </Box>
               </Box>
             </form>
           </CardContent>
        </Card>

        {/* KYC */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.secondary.dark}` }}>
           <CardContent sx={{ p: 4 }}>
             <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
               <Stack direction="row" spacing={2} alignItems="center" width="100%">
                 <Avatar sx={{ bgcolor: kycStatus?.estado_verificacion === 'APROBADA' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1), color: kycStatus?.estado_verificacion === 'APROBADA' ? 'success.main' : 'warning.main', width: 50, height: 50 }}><BadgeIcon fontSize="medium" /></Avatar>
                 <Box>
                   <Typography variant="h6" fontWeight={700}>Verificación de Identidad</Typography>
                   <Stack direction="row" spacing={1} alignItems="center">
                     <Typography variant="body2" color="text.secondary">Estado:</Typography>
                     <Chip label={kycStatus?.estado_verificacion || 'NO INICIADO'} color={getKycColor(kycStatus?.estado_verificacion) as any} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                   </Stack>
                 </Box>
               </Stack>
               {kycStatus?.estado_verificacion !== 'APROBADA' ? (
                 <Button variant="contained" color="warning" onClick={() => navigate('/kyc')} sx={{ minWidth: 150 }}>{kycStatus?.estado_verificacion === 'PENDIENTE' ? 'Ver Estado' : 'Iniciar KYC'}</Button>
               ) : (
                 <Box display="flex" alignItems="center" color="success.main" gap={1}><VerifiedUser /><Typography variant="body2" fontWeight={700}>Verificado</Typography></Box>
               )}
             </Stack>
           </CardContent>
        </Card>

        {/* SEGURIDAD */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.secondary.dark}` }}>
           <CardContent sx={{ p: 4 }}>
             <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
               <Stack direction="row" spacing={2} alignItems="center" width="100%">
                 <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 50, height: 50 }}><SecurityIcon /></Avatar>
                 <Box>
                   <Typography variant="h6" fontWeight={700}>Seguridad de la Cuenta</Typography>
                   <Typography variant="body2" color="text.secondary">{user?.is_2fa_enabled ? 'Autenticación de dos factores (2FA) activada.' : 'Protege tu cuenta activando la verificación en dos pasos.'}</Typography>
                 </Box>
               </Stack>
               <Button variant="outlined" color="primary" onClick={() => setShowSecuritySection(!showSecuritySection)} sx={{ minWidth: 120 }}>{showSecuritySection ? 'Ocultar' : 'Configurar'}</Button>
             </Stack>
             {showSecuritySection && <Box mt={4}><Divider sx={{ mb: 4 }} /><SecuritySettings /></Box>}
           </CardContent>
        </Card>

        {/* === SECTION 4: DANGER ZONE (Actualizado con Hook) === */}
        <Card 
          elevation={0} 
          sx={{ 
            border: `1px solid ${deudaActiva ? theme.palette.warning.light : theme.palette.error.light}`, 
            bgcolor: deudaActiva ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.error.main, 0.02) 
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

              {/* ALERTAS (Deuda / Documentos) */}
              {deudaActiva ? (
                <Alert severity="warning" icon={<MoneyOff fontSize="inherit" />} sx={{ border: `1px solid ${theme.palette.warning.main}` }}>
                  <AlertTitle fontWeight={700}>Acción Bloqueada: Deudas Pendientes</AlertTitle>
                  <Typography variant="body2" paragraph>
                    No puedes desactivar tu cuenta mientras tengas <strong>suscripciones con pagos pendientes</strong>. Debes regularizar tu situación primero.
                  </Typography>
                  <Button size="small" color="warning" variant="outlined" onClick={() => navigate('/client/suscripciones')} sx={{ fontWeight: 700 }}>
                    Ir a pagar suscripciones
                  </Button>
                </Alert>
              ) : (
                <Alert severity="info" icon={<Description fontSize="inherit" />} sx={{ border: `1px solid ${theme.palette.info.main}`, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                  <AlertTitle fontWeight={700}>Importante: Respalda tu información</AlertTitle>
                  <Typography variant="body2" paragraph>
                    Al desactivar tu cuenta, <strong>perderás el acceso a la plataforma</strong> y no podrás descargar tus contratos firmados posteriormente. Te recomendamos descargarlos ahora.
                  </Typography>
                  <Button size="small" color="info" variant="outlined" onClick={() => navigate('/client/contratos')} sx={{ fontWeight: 700 }}>
                    Ir a Mis Documentos
                  </Button>
                </Alert>
              )}

              <Box display="flex" justifyContent="flex-end" pt={2}>
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick} // 🟢 4. Usamos el nuevo handler que llama al hook
                  disabled={deudaActiva || loadingDeudas}
                >
                  Desactivar Cuenta
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

      </Stack>

      <Snackbar open={successOpen} autoHideDuration={3000} onClose={() => setSuccessOpen(false)}>
        <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          ¡Perfil actualizado correctamente!
        </Alert>  
      </Snackbar>

      {/* 🟢 5. Modal conectado al hook */}
      {/* Pasamos los textos del config del hook para mantener consistencia */}
      <DeleteAccountModal 
        open={confirmController.open} 
        onClose={confirmController.close} 
        is2FAEnabled={user?.is_2fa_enabled || false}
        title={confirmController.config?.title}
        description={confirmController.config?.description}
      />

    </PageContainer>
  );
};

export default Perfil;