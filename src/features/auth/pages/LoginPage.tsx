import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import {
  ErrorOutline,
  InfoOutlined,
  LockClock,
  LockOpen,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";
import React from "react";
import { useNavigate } from "react-router-dom";
import AuthFormContainer from "./components/AuthFormContainer";
import TwoFactorAuthModal from "../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField";
import { ROUTES } from "@/routes";
import { useLogin } from "../hooks/useLogin";

// --- Subcomponente de Alertas (Memoizado implícitamente al estar fuera) ---
const LoginAlerts = ({ status, actions, navigate }: any) => {
  if (status.resendSuccess) {
    return (
      <Alert severity="success" onClose={actions.closeResendSuccess} sx={{ mb: 3 }}>
        ✅ Email reenviado. Revisa tu bandeja de entrada.
      </Alert>
    );
  }

  if (status.isSessionExpired) {
    return (
      <Alert severity="warning" icon={<LockClock />} onClose={actions.closeSessionExpired} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600}>Tu sesión ha expirado</Typography>
        <Typography variant="body2">Por seguridad, inicia sesión nuevamente.</Typography>
      </Alert>
    );
  }

  if (status.vieneDeProyecto && !status.isAuthenticated && !status.localError) {
    return (
      <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3 }}>
        Inicia sesión para ver los detalles del proyecto.
      </Alert>
    );
  }

  if (status.localError) {
    const { type, msg } = status.localError;
    
    if (type === 'invalid_credentials') {
      return (
        <Alert severity="error" icon={<ErrorOutline />} onClose={actions.clearErrors} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>Credenciales incorrectas</Typography>
          <Box mt={1}>
            <Link component="button" variant="caption" onClick={() => navigate(ROUTES.FORGOT_PASSWORD)} sx={{ fontWeight: 'bold', textDecoration: 'underline', color: 'error.dark' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </Alert>
      );
    }

    if (type === 'account_not_activated') {
      return (
        <Alert severity="info" icon={<InfoOutlined />} onClose={actions.clearErrors} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>Cuenta no activada</Typography>
          <Box mt={1}>
            <Link component="button" variant="caption" onClick={actions.handleResendEmail} disabled={status.isLoading} sx={{ fontWeight: 'bold', textDecoration: 'underline', color: 'info.dark' }}>
              Reenviar correo de confirmación
            </Link>
          </Box>
        </Alert>
      );
    }

    return <Alert severity="error" onClose={actions.clearErrors} sx={{ mb: 3 }}>{msg}</Alert>;
  }

  return null;
};

// --- Componente Principal ---
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { formik, status, actions } = useLogin();

  if (status.isInitializing) {
    return <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <AuthFormContainer title="¡Hola de nuevo!" subtitle="Ingresá a tu cuenta para gestionar tus inversiones.">
        
        {/* Header Visual */}
        <Box textAlign="center" mb={4}>
          <Box sx={{ 
            width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' 
          }}>
            <LockOpen fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700}>Iniciar Sesión</Typography>
        </Box>

        {/* Zona de Alertas */}
        <LoginAlerts status={status} actions={actions} navigate={navigate} />

        {/* Formulario */}
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <FormTextField
              name="identificador"
              label="Email o Usuario"
              formik={formik}
              disabled={status.isLoading}
            />

            <FormTextField
              name="password"
              label="Contraseña"
              type={status.showPassword ? "text" : "password"}
              formik={formik}
              disabled={status.isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={actions.togglePassword} edge="end">
                      {status.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={status.isLoading}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              {status.isLoading ? <CircularProgress size={24} color="inherit" /> : "INGRESAR"}
            </Button>
          </Stack>
        </form>

        {/* Footer Links */}
        <Box textAlign="center" mt={4} display="flex" flexDirection="column" gap={1.5}>
          <Link
            component="button" variant="body2" color="text.secondary" underline="hover"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Link
              component="button" variant="body2" fontWeight={700} underline="hover"
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Regístrate
            </Link>
          </Typography>
        </Box>
      </AuthFormContainer>

      {/* Modal 2FA */}
      <TwoFactorAuthModal
        open={status.requires2FA}
        onClose={() => { actions.logout(); actions.clearErrors(); }}
        onSubmit={actions.verify2FA}
        isLoading={status.isLoading}
        error={status.localError?.type === 'generic' ? status.localError.msg : undefined}
        title="Verificación en 2 Pasos"
        description="Tu cuenta está protegida. Ingresa el código de tu aplicación autenticadora."
      />
    </>
  );
};

export default LoginPage;