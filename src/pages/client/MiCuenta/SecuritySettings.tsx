import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Alert, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stepper, Step, StepLabel, CircularProgress, Chip,
  InputAdornment, IconButton, Divider, Card, CardContent,
  alpha, useTheme, Avatar, Tooltip
} from '@mui/material';
import {
  Security, QrCode2, GppGood, GppMaybe, Close, ContentCopy, Lock, Visibility, VisibilityOff
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { useAuth } from '../../../context/AuthContext';
import { use2FA } from '../../../hooks/use2FA';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

const SecuritySettings: React.FC = () => {
  const { user, refetchUser, disable2FA } = useAuth();
  const theme = useTheme();
  
  // Hook de Lógica 2FA
  const { 
    generateSecret, enable2FA, isLoading: hookLoading, 
    error: hookError, clearError: clearHookError,
    secret, qrCodeUrl: otpAuthUrl 
  } = use2FA();

  // Estados de UI
  const [activeStep, setActiveStep] = useState(0);
  const [isEnabling, setIsEnabling] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);

  // Estados Desactivación
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  // Feedback
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const is2FAEnabled = user?.is_2fa_enabled || false;
  const isLoading = hookLoading || disableLoading;
  const displayError = hookError || localError;

  useEffect(() => {
    if (otpAuthUrl) {
      QRCode.toDataURL(otpAuthUrl)
        .then(url => setQrImage(url))
        .catch(() => setLocalError('Error generando imagen QR'));
    }
  }, [otpAuthUrl]);

  // Handlers Activación
  const handleStartEnable = async () => {
    setLocalError(null);
    clearHookError();
    const success = await generateSecret();
    if (success) {
      setIsEnabling(true);
      setActiveStep(0);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) return;
    const success = await enable2FA(verificationCode);
    if (success) {
      setSuccessMessage('¡Autenticación de dos factores activada exitosamente!');
      handleCloseEnableDialog();
    }
  };

  const handleCloseEnableDialog = () => {
    setIsEnabling(false);
    setActiveStep(0);
    setVerificationCode('');
    setQrImage(null);
    clearHookError();
    setLocalError(null);
  };

  // Handlers Desactivación
  const handleConfirmDisable = async () => {
    if (!disablePassword || disableCode.length !== 6) {
      setLocalError('Completa todos los campos correctamente');
      return;
    }
    setDisableLoading(true);
    setLocalError(null);
    try {
      await disable2FA(disablePassword, disableCode);
      setSuccessMessage('Verificación en dos pasos desactivada.');
      handleCloseDisableDialog();
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Error al desactivar 2FA');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleCloseDisableDialog = () => {
    setIsDisabling(false);
    setDisablePassword('');
    setDisableCode('');
    setShowPassword(false);
    setLocalError(null);
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <PageContainer maxWidth="md">
      {/* Encabezado */}
      <PageHeader 
        title="Seguridad de la Cuenta" 
        subtitle="Gestiona la autenticación de dos factores y protege el acceso a tu cuenta."
      />

      {/* Contenedor centrado para las tarjetas */}
      <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 2 }}>
        
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* --- ESTADO ACTUAL --- */}
        <Card 
          elevation={0}
          sx={{
            mb: 4,
            border: '1px solid',
            borderColor: is2FAEnabled ? 'success.main' : 'warning.main',
            bgcolor: is2FAEnabled ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.warning.main, 0.05),
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar 
                  sx={{ 
                    width: 56, height: 56,
                    bgcolor: is2FAEnabled ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.warning.main, 0.2),
                    color: is2FAEnabled ? 'success.main' : 'warning.main'
                  }}
                >
                  {is2FAEnabled ? <GppGood fontSize="large" /> : <GppMaybe fontSize="large" />}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color={is2FAEnabled ? 'success.main' : 'warning.main'}>
                    {is2FAEnabled ? 'Protección Activada' : 'Protección Desactivada'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {is2FAEnabled
                      ? 'Tu cuenta cuenta con una capa extra de seguridad.'
                      : 'Te recomendamos activar 2FA para proteger tus inversiones.'
                    }
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
                color={is2FAEnabled ? 'success' : 'warning'}
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* --- ACCIONES --- */}
        <Card 
          elevation={0} 
          sx={{ 
            border: `1px solid ${theme.palette.secondary.dark}`,
            bgcolor: 'background.default',
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={3}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                  <Security />
              </Avatar>
              <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Autenticación de Dos Factores (2FA)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Añade una capa adicional de seguridad solicitando un código de verificación desde tu aplicación móvil (Google Authenticator, Authy, etc.).
                  </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3, borderColor: 'secondary.dark' }} />

            {!is2FAEnabled ? (
              <Box>
                <Button
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  startIcon={<QrCode2 />}
                  onClick={handleStartEnable} 
                  disabled={isLoading}
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit"/> : 'Configurar Verificación en Dos Pasos'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Para desactivar la verificación, necesitarás confirmar tu contraseña y un código 2FA válido.
                </Alert>
                <Button
                  variant="outlined" 
                  color="error" 
                  size="large" 
                  fullWidth 
                  startIcon={<Lock />}
                  onClick={() => setIsDisabling(true)} 
                  disabled={isLoading}
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  Desactivar Verificación
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* --- DIALOGS (Fuera del contenedor visual principal) --- */}
      
      {/* DIALOG: ACTIVAR */}
      <Dialog open={isEnabling} onClose={handleCloseEnableDialog} maxWidth="sm" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          Configurar 2FA
          <IconButton onClick={handleCloseEnableDialog} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 3 }} alternativeLabel>
            {['Escanear QR', 'Verificar Código'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {displayError && <Alert severity="error" sx={{ mb: 3 }}>{displayError}</Alert>}

          {activeStep === 0 && qrImage && (
            <Stack spacing={3} alignItems="center">
              <Box p={2} border={`1px solid ${theme.palette.divider}`} borderRadius={2}>
                <img src={qrImage} alt="QR Code" style={{ width: '100%', maxWidth: 200, display: 'block' }} />
              </Box>
              
              {secret && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600}>
                    CLAVE DE CONFIGURACIÓN MANUAL
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1, wordBreak: 'break-all', fontWeight: 600 }}>
                      {secret}
                    </Typography>
                    <Tooltip title="Copiar código">
                      <IconButton onClick={handleCopySecret} size="small" color="primary">
                        {copiedSecret ? <GppGood color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
              <Button variant="contained" onClick={() => setActiveStep(1)} fullWidth>Continuar</Button>
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={3} mt={2}>
              <Typography variant="body2" textAlign="center">
                Abre tu aplicación de autenticación e ingresa el código de 6 dígitos.
              </Typography>
              <TextField
                fullWidth 
                placeholder="000 000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ 
                  maxLength: 6, 
                  style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.5rem', fontWeight: 700 } 
                }}
              />
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={() => setActiveStep(0)} fullWidth>Atrás</Button>
                <Button 
                  variant="contained" onClick={handleVerifyAndEnable} fullWidth 
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verificar y Activar'}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: DESACTIVAR */}
      <Dialog open={isDisabling} onClose={handleCloseDisableDialog} maxWidth="xs" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          Desactivar 2FA
          <IconButton onClick={handleCloseDisableDialog} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tu cuenta será más vulnerable a accesos no autorizados.
          </Alert>
          
          {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
          
          <Stack spacing={2}>
            <TextField
              fullWidth type={showPassword ? 'text' : 'password'} label="Contraseña Actual"
              value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth label="Código 2FA" placeholder="000000"
              value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4, fontWeight: 600 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleCloseDisableDialog} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleConfirmDisable} color="error" variant="contained"
            disabled={disableLoading || !disablePassword || disableCode.length !== 6}
          >
            {disableLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirmar Desactivación'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SecuritySettings;