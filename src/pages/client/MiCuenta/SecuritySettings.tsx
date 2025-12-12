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
import { useAuth } from '../../../context/AuthContext';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import QRCode from 'qrcode';

const SecuritySettings: React.FC = () => {
  const { user, generate2FASecret, enable2FA, disable2FA, refetchUser, error, clearError } = useAuth();

  // Estados para activación
  const [isEnabling, setIsEnabling] = useState(false);
  const [step, setStep] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  // Estados para desactivación
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const is2FAEnabled = user?.is_2fa_enabled || false;

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ========================================
  // FUNCIONES DE ACTIVACIÓN
  // ========================================

  const handleStartEnable = async () => {
    setLocalError(null);
    setLoading(true);
    try {
      const data = await generate2FASecret();

      // Generar QR desde la URL
      const qrImage = await QRCode.toDataURL(data.otpauthUrl);
      setQrCodeUrl(qrImage);
      setSecret(data.secret);

      setIsEnabling(true);
      setStep(0);
    } catch (err: any) {
      setLocalError(err?.message || 'Error al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setLocalError('El código debe tener 6 dígitos');
      return;
    }

    setLocalError(null);
    setLoading(true);
    try {
      await enable2FA(verificationCode);
      await refetchUser();

      setSuccessMessage('¡Autenticación de dos factores activada exitosamente! 🎉');
      handleCloseEnableDialog();
    } catch (err: any) {
      setLocalError(err?.message || 'Código incorrecto. Verifica tu app de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEnableDialog = () => {
    setIsEnabling(false);
    setStep(0);
    setQrCodeUrl(null);
    setSecret(null);
    setVerificationCode('');
    setLocalError(null);
    clearError();
  };

  // ========================================
  // FUNCIONES DE DESACTIVACIÓN
  // ========================================

  const handleStartDisable = () => {
    setIsDisabling(true);
    setLocalError(null);
    clearError();
  };

  const handleConfirmDisable = async () => {
    if (!disablePassword || disableCode.length !== 6) {
      setLocalError('Completa todos los campos correctamente');
      return;
    }

    setLocalError(null);
    setLoading(true);
    try {
      await disable2FA(disablePassword, disableCode);
      await refetchUser();

      setSuccessMessage('Verificación en dos pasos desactivada');
      handleCloseDisableDialog();
    } catch (err: any) {
      setLocalError(err?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDisableDialog = () => {
    setIsDisabling(false);
    setDisablePassword('');
    setDisableCode('');
    setShowPassword(false);
    setLocalError(null);
    clearError();
  };

  // ========================================
  // UTILIDADES
  // ========================================

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

      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* ESTADO ACTUAL */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 4,
          border: '2px solid',
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

      {/* INFORMACIÓN Y ACCIONES */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '2px solid #ECECEC' }}>
        <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
          <Security sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Autenticación de Dos Factores (2FA)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Añade una capa adicional de seguridad solicitando un código de verificación
              desde tu aplicación móvil cada vez que inicies sesión.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {!is2FAEnabled ? (
          // SI NO ESTÁ ACTIVO
          <>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              ¿Por qué activar 2FA?
            </Typography>
            <Stack spacing={1.5} mb={4}>
              {[
                'Protege tu cuenta contra accesos no autorizados',
                'Requerido para realizar pagos y operaciones sensibles',
                'Cumple con estándares de seguridad bancaria',
                'Compatible con Google Authenticator, Authy y más'
              ].map((benefit, idx) => (
                <Box key={idx} display="flex" alignItems="center" gap={1.5}>
                  <CheckCircle sx={{ fontSize: 20, color: '#4CAF50' }} />
                  <Typography variant="body2">{benefit}</Typography>
                </Box>
              ))}
            </Stack>

            <Button
              variant="contained"
              size="large"
              startIcon={<QrCode2 />}
              onClick={handleStartEnable}
              disabled={loading}
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(204, 99, 51, 0.25)'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Activar Verificación en Dos Pasos'}
            </Button>
          </>
        ) : (
          // SI YA ESTÁ ACTIVO
          <>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Tu cuenta está protegida. Si deseas desactivar 2FA, necesitarás tu contraseña
              y un código actual de tu aplicación de autenticación.
            </Alert>

            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<Lock />}
              onClick={handleStartDisable}
              disabled={loading}
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: 600,
                borderRadius: 3,
                borderWidth: 2
              }}
            >
              Desactivar Verificación en Dos Pasos
            </Button>
          </>
        )}
      </Paper>

      {/* ========================================
          DIALOG: ACTIVAR 2FA
      ======================================== */}
      <Dialog
        open={isEnabling}
        onClose={handleCloseEnableDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <QrCode2 sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>
                Configurar 2FA
              </Typography>
            </Box>
            <IconButton onClick={handleCloseEnableDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={step} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {localError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {localError}
            </Alert>
          )}

          {step === 0 && qrCodeUrl && (
            <Stack spacing={3} alignItems="center">
              <Alert severity="info" sx={{ width: '100%', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Paso 1: Escanea este código QR
                </Typography>
                <Typography variant="caption">
                  Abre tu app de autenticación (Google Authenticator, Authy, etc.)
                  y escanea este código QR.
                </Typography>
              </Alert>

              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  border: '2px solid #ECECEC'
                }}
              >
                <img
                  src={qrCodeUrl}
                  alt="QR Code 2FA"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 240,
                    height: 'auto'
                  }}
                />
              </Paper>

              {secret && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#F6F6F6',
                    borderRadius: 2,
                    width: '100%'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Clave manual (si no puedes escanear):
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{
                        flex: 1,
                        bgcolor: 'white',
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid #D4D4D4',
                        wordBreak: 'break-all'
                      }}
                    >
                      {secret}
                    </Typography>
                    <IconButton
                      onClick={handleCopySecret}
                      size="small"
                      sx={{ color: copiedSecret ? 'success.main' : 'text.secondary' }}
                    >
                      {copiedSecret ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Box>
                </Paper>
              )}

              <Button
                variant="contained"
                onClick={() => setStep(1)}
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Continuar
              </Button>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Paso 2: Ingresa el código de verificación
                </Typography>
                <Typography variant="caption">
                  Abre tu aplicación y escribe el código de 6 dígitos que aparece.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Código de Verificación"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: 'center',
                    letterSpacing: 8,
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#F6F6F6'
                  }
                }}
              />

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(0)}
                  fullWidth
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  variant="contained"
                  onClick={handleVerifyAndEnable}
                  fullWidth
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? <CircularProgress size={24} /> : 'Activar 2FA'}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================
          DIALOG: DESACTIVAR 2FA
      ======================================== */}
      <Dialog
        open={isDisabling}
        onClose={handleCloseDisableDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Warning sx={{ color: 'error.main' }} />
              <Typography variant="h6" fontWeight={700}>
                Desactivar 2FA
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDisableDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              ⚠️ Advertencia de Seguridad
            </Typography>
            <Typography variant="caption">
              Desactivar 2FA reducirá la seguridad de tu cuenta. Solo continúa si estás seguro.
            </Typography>
          </Alert>

          {localError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {localError}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Tu Contraseña"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Código 2FA Actual"
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  letterSpacing: 6,
                  fontSize: '1.25rem',
                  fontWeight: 700
                }
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDisableDialog}
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDisable}
            color="error"
            variant="contained"
            disabled={loading || !disablePassword || disableCode.length !== 6}
          >
            {loading ? <CircularProgress size={20} /> : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default SecuritySettings;