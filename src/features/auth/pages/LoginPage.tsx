import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  CircularProgress,
  Box,
  Link,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { 
  Visibility, 
  VisibilityOff, 
  InfoOutlined, 
  LockOpen,
  ErrorOutline,
  LockClock
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useAuth } from "@/core/context/AuthContext";
import { ROUTES } from "@/routes";
import TwoFactorAuthModal from "../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField/FormTextField";

// Definimos el tipo de error local
type LocalErrorType = 'invalid_credentials' | 'account_not_activated' | 'session_expired' | 'generic';

interface LocationState {
  from?: { pathname: string } | string;
  message?: string;
  sessionExpired?: boolean;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const {
    login,
    verify2FA,
    requires2FA,
    isLoading,
    isInitializing,
    clearError: clearAuthError,
    logout,
    user,
    isAuthenticated,
    resendConfirmation
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // ✅ ESTADO LOCAL: Aquí se guarda el error para mostrarlo en pantalla
  const [localError, setLocalError] = useState<{ type: LocalErrorType; msg: string } | null>(null);

  const [isSessionExpiredRedirect, setIsSessionExpiredRedirect] = useState(false);

  const state = location.state as LocationState;
  const from = useMemo(() => state?.from ? (typeof state.from === 'string' ? state.from : state.from.pathname) : null, [state]);
  const successMessage = state?.message;
  const vieneDeProyecto = from?.includes('/proyectos/');

  // 1. Manejo de redirección por sesión expirada
  useEffect(() => {
    if (state?.sessionExpired) {
      setIsSessionExpiredRedirect(true);
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  // 🔴 CORRECCIÓN CRÍTICA AQUÍ 🔴
  // Antes, esto borraba el error en cada render. Ahora solo lo hace al desmontar el componente.
  useEffect(() => {
    return () => {
      // Solo limpiamos el estado global al salir de la página
      clearAuthError(); 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <--- El array vacío asegura que solo corra al desmontar (salir de la pagina)

  // Redirección si ya está autenticado
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user && !requires2FA) {
      const destino = from && from !== ROUTES.PUBLIC.HOME 
        ? from 
        : (user.rol === 'admin' ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.DASHBOARD);
      navigate(destino, { replace: true });
    }
  }, [isInitializing, isAuthenticated, user, requires2FA, navigate, from]);

  const formik = useFormik({
    initialValues: { identificador: "", password: "" },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o usuario"),
      password: Yup.string().required("Ingresá tu contraseña"),
    }),
    onSubmit: async (values) => {
      // Limpiamos estados antes de intentar login
      setResendSuccess(false);
      setIsSessionExpiredRedirect(false);
      setLocalError(null); 
      clearAuthError();

      try {
        await login({
          identificador: values.identificador,
          contraseña: values.password,
        });
      } catch (err: any) {
        // 🔥 CAPTURA DEL ERROR
        const msg = err?.message || err?.error || "Ocurrió un error inesperado";
        const msgLower = msg.toLowerCase();

        console.log("❌ Error procesado para UI:", msg);

        let type: LocalErrorType = 'generic';

        if (msgLower.includes('credenciales incorrectas') || 
            msgLower.includes('usuario o contraseña') ||
            msgLower.includes('invalid credentials')) {
          type = 'invalid_credentials';
        } else if (msgLower.includes('cuenta no activada')) {
          type = 'account_not_activated';
        } else if (msgLower.includes('sesión expirada')) {
          type = 'session_expired';
        }

        // Forzamos la actualización del estado local
        setLocalError({ type, msg });
      }
    },
  });

  const handleResendEmail = async () => {
    setResendSuccess(false);
    try {
      await resendConfirmation(formik.values.identificador);
      setResendSuccess(true);
      setLocalError(null);
    } catch (err) { }
  };

  // --- RENDERIZADO DE ALERTAS ---
  const renderErrorAlert = () => {
    if (resendSuccess) {
      return (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setResendSuccess(false)}>
          ✅ Email reenviado. Revisa tu bandeja de entrada.
        </Alert>
      );
    }

    if (isSessionExpiredRedirect) {
      return (
        <Alert severity="warning" icon={<LockClock />} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setIsSessionExpiredRedirect(false)}>
          <Typography variant="body2" fontWeight={600}>Tu sesión ha expirado</Typography>
          <Typography variant="body2">Por seguridad, inicia sesión nuevamente.</Typography>
        </Alert>
      );
    }

    // SI NO HAY ERROR LOCAL, NO RENDERIZA NADA
    if (!localError) return null;

    switch (localError.type) {
      case 'invalid_credentials':
        return (
          <Alert 
            severity="error" 
            icon={<ErrorOutline />} 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={() => setLocalError(null)}
          >
            <Typography variant="body2" fontWeight={600}>Credenciales incorrectas</Typography>
            <Typography variant="body2">Verifica tu usuario y contraseña.</Typography>
            <Box mt={1}>
              <Link 
                component="button" 
                variant="caption" 
                onClick={() => navigate(ROUTES.FORGOT_PASSWORD)} 
                sx={{ fontWeight: 'bold', textDecoration: 'underline' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>
          </Alert>
        );

      case 'account_not_activated':
        return (
          <Alert 
            severity="info" 
            icon={<InfoOutlined />} 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={() => setLocalError(null)}
          >
            <Typography variant="body2" fontWeight={600}>Cuenta no activada</Typography>
            <Typography variant="body2">Debes confirmar tu email.</Typography>
            <Box mt={1}>
              <Link 
                component="button" 
                variant="caption" 
                onClick={handleResendEmail} 
                disabled={isLoading} 
                sx={{ fontWeight: 'bold', textDecoration: 'underline' }}
              >
                Reenviar confirmación
              </Link>
            </Box>
          </Alert>
        );

      case 'session_expired':
          return (
            <Alert severity="warning" icon={<LockClock />} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLocalError(null)}>
              <Typography variant="body2">Tu sesión ha expirado.</Typography>
            </Alert>
          );

      default:
        return (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLocalError(null)}>
            {localError.msg}
          </Alert>
        );
    }
  };

  if (isInitializing) {
    return <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <AuthFormContainer
        title="¡Hola de nuevo!"
        subtitle="Ingresá a tu cuenta para gestionar tus inversiones."
      >
        <Box textAlign="center" mb={4}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2
            }}
          >
            <LockOpen fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700}>Iniciar Sesión</Typography>
        </Box>

        {vieneDeProyecto && !isAuthenticated && !localError && !isSessionExpiredRedirect && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
            Inicia sesión para ver los detalles del proyecto.
          </Alert>
        )}

        {/* ✅ RENDERIZADO DEL ERROR */}
        {renderErrorAlert()}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <FormTextField
              name="identificador"
              label="Email o Usuario"
              formik={formik}
              disabled={isLoading}
            />

            <FormTextField
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              formik={formik}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
              disabled={isLoading}
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "INGRESAR"}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={4} display="flex" flexDirection="column" gap={1.5}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            color="text.secondary"
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate(ROUTES.REGISTER)}
              fontWeight={700}
            >
              Regístrate
            </Link>
          </Typography>
        </Box>
      </AuthFormContainer>

      <TwoFactorAuthModal
        open={requires2FA}
        onClose={() => { logout(); clearAuthError(); setLocalError(null); }}
        onSubmit={verify2FA}
        isLoading={isLoading}
        error={localError?.msg}
        title="Verificación en 2 Pasos"
        description="Tu cuenta está protegida. Ingresa el código."
      />
    </>
  );
};

export default LoginPage;