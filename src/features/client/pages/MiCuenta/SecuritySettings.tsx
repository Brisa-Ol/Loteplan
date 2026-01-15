// src/pages/client/MiCuenta/SecuritySettings.tsx

// ==========================================
// 1. IMPORTS
// ==========================================
import React, { useEffect, useState } from 'react';

// Librerías Externas
import QRCode from 'qrcode';

// Iconos Material UI
import {
  Close,
  ContentCopy,
  GppGood,
  GppMaybe,
  Lock,
  QrCode2,
  Security,
  Info,
  Smartphone,
  Timer,
  Payment,
  SupportAgent,
  VisibilityOff,
  Visibility
} from '@mui/icons-material';

// Componentes Material UI
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';



// Componentes Propios
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { useAuth } from '@/core/context/AuthContext';
import type { ApiError } from '@/core/api/httpService';

/**
 * Componente SecuritySettings
 * ---------------------------
 * Gestiona la configuración de seguridad del usuario (2FA) e informa sobre su uso.
 */
const SecuritySettings: React.FC = () => {
  // Hooks Globales
  const { user, disable2FA, generate2FASecret, enable2FA, isLoading: authLoading } = useAuth();
  const theme = useTheme();

  // ==========================================
  // 2. ESTADOS
  // ==========================================

  // --- A. Estados del Flujo de Activación (Setup) ---
  const [isEnabling, setIsEnabling] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // --- B. Estados del Flujo de Desactivación ---
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  // --- C. Feedback y Utilidades ---
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Variables derivadas
  const is2FAEnabled = user?.is_2fa_enabled || false;
  const isLoading = authLoading || setupLoading || disableLoading;
  const displayError = setupError || localError;

  // ==========================================
  // 3. EFECTOS
  // ==========================================
  useEffect(() => {
    if (otpAuthUrl) {
      QRCode.toDataURL(otpAuthUrl)
        .then((url) => setQrImage(url))
        .catch(() => setLocalError('Error generando imagen QR'));
    }
  }, [otpAuthUrl]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================

  const handleStartEnable = async () => {
    setLocalError(null);
    setSetupError(null);
    setSetupLoading(true);
    try {
      const data = await generate2FASecret();
      setSecret(data.secret);
      setOtpAuthUrl(data.otpauthUrl);
      setIsEnabling(true);
      setActiveStep(0);
    } catch (err) {
      setSetupError('Error generando secreto 2FA. Intenta nuevamente.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) return;
    setSetupLoading(true);
    try {
      await enable2FA(verificationCode);
      setSuccessMessage('¡Autenticación de dos factores activada exitosamente!');
      handleCloseEnableDialog();
    } catch (err) {
      setSetupError('Código incorrecto. Verifica e intenta de nuevo.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCloseEnableDialog = () => {
    setIsEnabling(false);
    setActiveStep(0);
    setVerificationCode('');
    setQrImage(null);
    setSecret(null);
    setOtpAuthUrl(null);
    setSetupError(null);
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
      setSuccessMessage('Verificación en dos pasos desactivada.');
      handleCloseDisableDialog();
    } catch (error) {
      const err = error as ApiError;
      const msg = err.message || 'Error al desactivar 2FA';
      setLocalError(msg);
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

  // ==========================================
  // 5. RENDERIZADO
  // ==========================================
  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Seguridad de la Cuenta"
        subtitle="Gestiona la autenticación de dos factores y protege el acceso a tu cuenta."
      />

      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 2 }}>
        
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* --- TARJETA 1: ESTADO --- */}
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
                      : 'Activa el 2FA para proteger tus inversiones.'
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

        {/* --- TARJETA 2: INFORMACIÓN EDUCATIVA --- */}
        <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            
            {/* CSS Grid para Layout */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
              gap: 6 // Aumenté el gap para mejor separación
            }}>
              
              {/* Columna Izquierda: Instrucciones Paso a Paso */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Info color="primary" />
                  <Typography variant="h6" fontWeight={700}>¿Cómo funciona?</Typography>
                </Box>

                <Stack spacing={3}>
                  {/* Paso 1 */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      1. Descarga "Google Authenticator" en tu celular
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      {/* Logo Google Authenticator */}
                      <Box 
                        component="img" 
                        src="https://play-lh.googleusercontent.com/NntMALIH4odanPPYSqUOXsX8zy_giiK2olJiqkcxwFIOOspVrhMi9Miv6LYdRnKIg-3R=w480-h960-rw" 
                        alt="Google Authenticator Logo"
                        sx={{ width: 48, height: 48 }}
                      />
                      
                      
                    </Box>
                     <Typography variant="subtitle2" fontWeight={400} gutterBottom>
                      Disponible en Google Play y App Store
                    </Typography>
                  
                  </Box>

                  {/* Pasos 2 y 3 */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>2. Inicia sesión</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entra a la app con tu cuenta de Google.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>3. Vincula tu cuenta</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Escanea el código QR que te brindamos o escribe el código manualmente. ¡Listo, ya protegiste tu cuenta!
                    </Typography>
                  </Box>

                  {/* Paso 4 (Alerta) */}
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={700} display="block">
                      4. IMPORTANTE:
                    </Typography>
                    <Typography variant="caption">
                      No borres el token de la app, lo vas a necesitar para operar en la página.
                    </Typography>
                  </Alert>
                </Stack>
              </Box>

              {/* Columna Derecha: Reglas de Uso */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Security color="primary" />
                  <Typography variant="h6" fontWeight={700}>Reglas de Seguridad</Typography>
                </Box>
                <List dense sx={{ bgcolor: 'background.default', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon><Timer color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Inicio de Sesión" 
                      secondary="Se solicitará el token la primera vez y luego cada 15 días en este dispositivo." 
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <Divider variant="middle" component="li" />
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon><Payment color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Pagos y Retiros" 
                      secondary="Por seguridad, siempre pediremos el token al realizar transacciones monetarias." 
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                    />
                  </ListItem>
                </List>
              </Box>

            </Box>
          </CardContent>
        </Card>

        {/* --- TARJETA 3: ACCIONES --- */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.secondary.dark}`,
            bgcolor: 'background.default',
            borderRadius: 3,
            mb: 4
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start" mb={3}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <Smartphone />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>Configuración</Typography>
                <Typography variant="body2" color="text.secondary">
                  {is2FAEnabled 
                    ? 'Tu cuenta está protegida. Si necesitas cambiar de dispositivo, deberás desactivarlo primero.' 
                    : 'Escanea el código QR con Google Authenticator para vincular tu cuenta.'}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3, borderColor: 'secondary.dark' }} />

            {!is2FAEnabled ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<QrCode2 />}
                onClick={handleStartEnable}
                disabled={isLoading}
                sx={{ borderRadius: 2, py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Configurar Ahora'}
              </Button>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Para desactivar la verificación, necesitarás confirmar tu contraseña actual y un código 2FA válido.
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

        {/* --- SECCIÓN DE AYUDA / SOPORTE --- */}
        <Box sx={{ textAlign: 'center', p: 3, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3 }}>
          <Stack direction="row" justifyContent="center" alignItems="center" gap={1} mb={1}>
            <SupportAgent color="info" />
            <Typography variant="subtitle1" fontWeight={700} color="info.main">
              ¿Perdiste acceso a tu autenticador?
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Si perdiste tu celular o borraste la app por error, no podrás ingresar a tu cuenta automáticamente. 
            Por favor, ponte en contacto con un administrador para verificar tu identidad y restablecer el acceso manual.
          </Typography>
        </Box>

      </Box>

      {/* ========================================== */}
      {/* 6. MODALES (Dialogs)                       */}
      {/* ========================================== */}

      {/* --- MODAL ACTIVACIÓN (Setup) --- */}
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

          {/* PASO 1: Mostrar QR */}
          {activeStep === 0 && qrImage && (
            <Stack spacing={3} alignItems="center">
              <Typography variant="body2" textAlign="center">
                Abre <strong>Google Authenticator</strong> en tu celular y selecciona "Escanear código QR".
              </Typography>
              <Box p={2} border={`1px solid ${theme.palette.divider}`} borderRadius={2}>
                <img src={qrImage} alt="QR Code" style={{ width: '100%', maxWidth: 200, display: 'block' }} />
              </Box>

              {secret && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={600}>
                    ¿No puedes escanear? Usa esta clave:
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

          {/* PASO 2: Verificar Código */}
          {activeStep === 1 && (
            <Stack spacing={3} mt={2}>
              <Typography variant="body2" textAlign="center">
                Ingresa el código de 6 dígitos que aparece en tu aplicación para confirmar la vinculación.
                <br />
                <Typography variant="caption" color="text.secondary">
                  Esto activará la protección inmediatamente.
                </Typography>
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

      {/* --- MODAL DESACTIVACIÓN --- */}
      <Dialog open={isDisabling} onClose={handleCloseDisableDialog} maxWidth="xs" fullWidth>
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          Desactivar 2FA
          <IconButton onClick={handleCloseDisableDialog} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tu cuenta quedará menos protegida.
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