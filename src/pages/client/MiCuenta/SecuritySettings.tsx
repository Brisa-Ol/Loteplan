import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Alert, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stepper, Step, StepLabel, CircularProgress, Chip,
  InputAdornment, IconButton, Divider
} from '@mui/material';
import {
  Security, QrCode2, CheckCircle, Lock, Visibility, VisibilityOff,
  Shield, Warning, ContentCopy, Close
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { useAuth } from '../../../context/AuthContext';
import { use2FA } from '../../../hooks/use2FA';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';



const SecuritySettings: React.FC = () => {
  const { user, refetchUser, disable2FA } = useAuth();
  
  // 1. Hook de Lógica para Activación (Limpia el componente)
  const { 
    generateSecret, 
    enable2FA, 
    isLoading: hookLoading, 
    error: hookError, 
    clearError: clearHookError,
    secret, 
    qrCodeUrl: otpAuthUrl // Renombramos porque esto es el string 'otpauth://...'
  } = use2FA();

  // Estados de UI
  const [activeStep, setActiveStep] = useState(0);
  
  // Estados para Activación
  const [isEnabling, setIsEnabling] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);

  // Estados para Desactivación
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false); // Loading local para desactivar

  // Feedback UI
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const is2FAEnabled = user?.is_2fa_enabled || false;
  const isLoading = hookLoading || disableLoading;
  const displayError = hookError || localError;

  // Limpiar mensajes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Generar Imagen QR cuando tenemos la URL del protocolo
  useEffect(() => {
    if (otpAuthUrl) {
      QRCode.toDataURL(otpAuthUrl)
        .then(url => setQrImage(url))
        .catch(err => setLocalError('Error generando imagen QR'));
    }
  }, [otpAuthUrl]);

  // ========================================
  // HANDLERS DE ACTIVACIÓN (Usando use2FA)
  // ========================================

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
      setSuccessMessage('¡Autenticación de dos factores activada exitosamente! 🎉');
      await refetchUser(); // Actualizar estado del usuario
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

  // ========================================
  // HANDLERS DE DESACTIVACIÓN (Directo a AuthContext)
  // ========================================

  const handleStartDisable = () => {
    setIsDisabling(true);
    setLocalError(null);
  };

  const handleConfirmDisable = async () => {
    if (!disablePassword || disableCode.length !== 6) {
      setLocalError('Completa todos los campos correctamente');
      return;
    }

    setDisableLoading(true);
    setLocalError(null);
    try {
      await disable2FA(disablePassword, disableCode);
      await refetchUser();
      setSuccessMessage('Verificación en dos pasos desactivada.');
      handleCloseDisableDialog();
    } catch (err: any) {
      setLocalError(err.response?.data?.error || err.message || 'Error al desactivar 2FA');
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

  // Utilidades
  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const steps = ['Escanear QR', 'Verificar Código'];

  return (
    <PageContainer maxWidth="md">
      {/* HEADER */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security sx={{ fontSize: 32, color: 'primary.main' }} />
          Seguridad de la Cuenta
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Protege tu cuenta con verificación en dos pasos (2FA)
        </Typography>
      </Box>

      {/* ALERTAS */}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 3, borderRadius: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* ESTADO ACTUAL */}
      <Paper
        elevation={0}
        sx={{
          p: 4, mb: 3, borderRadius: 4, border: '2px solid',
          borderColor: is2FAEnabled ? '#4CAF50' : '#FF9800',
          bgcolor: is2FAEnabled ? '#E8F5E9' : '#FFF3E0'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            {is2FAEnabled ? (
              <Shield sx={{ fontSize: 48, color: '#4CAF50' }} />
            ) : (
              <Warning sx={{ fontSize: 48, color: '#F57C00' }} />
            )}
            <Box>
              <Typography variant="h6" fontWeight={700} color={is2FAEnabled ? '#2E7D32' : '#E65100'}>
                {is2FAEnabled ? 'Protección Activada' : 'Protección Desactivada'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {is2FAEnabled
                  ? 'Tu cuenta está protegida con verificación en dos pasos'
                  : 'Activa 2FA para mayor seguridad en tus transacciones'
                }
              </Typography>
            </Box>
          </Box>
          <Chip
            label={is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
            color={is2FAEnabled ? 'success' : 'warning'}
            sx={{ fontWeight: 700, fontSize: '0.875rem', px: 2 }}
          />
        </Box>
      </Paper>

      {/* ACCIONES */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '2px solid #ECECEC' }}>
        <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
          <Security sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>Autenticación de Dos Factores (2FA)</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Añade una capa adicional de seguridad solicitando un código de verificación desde tu aplicación móvil.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {!is2FAEnabled ? (
          <>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>¿Por qué activar 2FA?</Typography>
            <Stack spacing={1.5} mb={4}>
              {['Protege contra accesos no autorizados', 'Requerido para pagos', 'Estándar de seguridad bancaria'].map((b, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1.5}>
                  <CheckCircle sx={{ fontSize: 20, color: '#4CAF50' }} />
                  <Typography variant="body2">{b}</Typography>
                </Box>
              ))}
            </Stack>
            <Button
              variant="contained" size="large" fullWidth startIcon={<QrCode2 />}
              onClick={handleStartEnable} disabled={isLoading}
              sx={{ py: 1.5, fontWeight: 700, borderRadius: 3 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit"/> : 'Activar Verificación en Dos Pasos'}
            </Button>
          </>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Para desactivar 2FA, necesitarás tu contraseña y un código actual.
            </Alert>
            <Button
              variant="outlined" color="error" size="large" fullWidth startIcon={<Lock />}
              onClick={handleStartDisable} disabled={isLoading}
              sx={{ py: 1.5, fontWeight: 600, borderRadius: 3, borderWidth: 2 }}
            >
              Desactivar Verificación
            </Button>
          </>
        )}
      </Paper>

      {/* DIALOG: ACTIVAR 2FA */}
      <Dialog open={isEnabling} onClose={handleCloseEnableDialog} maxWidth="sm" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
          Configurar 2FA
          <IconButton onClick={handleCloseEnableDialog} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {displayError && <Alert severity="error" sx={{ mb: 3 }}>{displayError}</Alert>}

          {activeStep === 0 && qrImage && (
            <Stack spacing={3} alignItems="center">
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <img src={qrImage} alt="QR Code" style={{ width: '100%', maxWidth: 200, display: 'block' }} />
              </Paper>
              
              {secret && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>Clave manual:</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1, wordBreak: 'break-all' }}>{secret}</Typography>
                    <IconButton onClick={handleCopySecret} size="small">
                      {copiedSecret ? <CheckCircle color="success" /> : <ContentCopy />}
                    </IconButton>
                  </Box>
                </Paper>
              )}
              <Button variant="contained" onClick={() => setActiveStep(1)} fullWidth>Continuar</Button>
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={3}>
              <Typography variant="body2">Ingresa el código de 6 dígitos de tu app:</Typography>
              <TextField
                fullWidth label="Código de Verificación" placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.5rem' } }}
              />
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={() => setActiveStep(0)} fullWidth>Volver</Button>
                <Button 
                  variant="contained" onClick={handleVerifyAndEnable} fullWidth 
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Activar 2FA'}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: DESACTIVAR 2FA */}
      <Dialog open={isDisabling} onClose={handleCloseDisableDialog} maxWidth="xs" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
          Desactivar 2FA
          <IconButton onClick={handleCloseDisableDialog} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>Esto reducirá la seguridad de tu cuenta.</Alert>
          {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
          <Stack spacing={2}>
            <TextField
              fullWidth type={showPassword ? 'text' : 'password'} label="Tu Contraseña"
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
              fullWidth label="Código 2FA Actual" placeholder="000000"
              value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 6, fontWeight: 700 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDisableDialog} variant="outlined">Cancelar</Button>
          <Button 
            onClick={handleConfirmDisable} color="error" variant="contained"
            disabled={disableLoading || !disablePassword || disableCode.length !== 6}
          >
            {disableLoading ? <CircularProgress size={20} /> : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageContainer>
  );
};

export default SecuritySettings;