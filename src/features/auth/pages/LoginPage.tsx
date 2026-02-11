import React, { useState, useEffect, useMemo, useRef } from "react";
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

// Imports internos
import { useAuth } from "@/core/context/AuthContext";
import { ROUTES } from "@/routes";
import TwoFactorAuthModal from "../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField";

// Tipos para manejo de errores locales
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

  // Consumimos el contexto
  const {
    login,
    verify2FA,
    requires2FA,
    isLoading,
    isInitializing,
    clearError: clearAuthError, // Renombramos para claridad interna
    logout,
    user,
    isAuthenticated,
    resendConfirmation
  } = useAuth();

  // --- Estados Locales ---
  const [showPassword, setShowPassword] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isSessionExpiredRedirect, setIsSessionExpiredRedirect] = useState(false);

  // ✅ ESTADO LOCAL DEL ERROR: Esto asegura que el mensaje persista en la UI
  const [localError, setLocalError] = useState<{ type: LocalErrorType; msg: string } | null>(null);

  // --- Lógica de Historial ---
  const state = location.state as LocationState;
  const from = useMemo(() => state?.from ? (typeof state.from === 'string' ? state.from : state.from.pathname) : null, [state]);
  const vieneDeProyecto = from?.includes('/proyectos/');

  // 1. Manejo de redirección por sesión expirada
  useEffect(() => {
    if (state?.sessionExpired) {
      setIsSessionExpiredRedirect(true);
      // Limpiamos el flag del history para que no aparezca si el usuario refresca la página
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  // 2. ✅ CORRECCIÓN CRÍTICA DE LIMPIEZA
  // Usamos useRef para mantener la referencia a la función sin disparar el useEffect
  const clearErrorRef = useRef(clearAuthError);

  useEffect(() => {
    clearErrorRef.current = clearAuthError;
  }, [clearAuthError]);

  useEffect(() => {
    // Esta función de limpieza solo se ejecuta al DESMONTAR el componente (salir de la página)
    return () => {
      if (clearErrorRef.current) clearErrorRef.current();
      // Nota: No limpiamos localError aquí para evitar parpadeos visuales en la transición
    };
  }, []); // Array vacío = Solo al montar/desmontar

  // 3. Redirección si ya está autenticado y no requiere 2FA
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user && !requires2FA) {
      const destino = from && from !== ROUTES.PUBLIC.HOME
        ? from
        : (user.rol === 'admin' ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.DASHBOARD);
      navigate(destino, { replace: true });
    }
  }, [isInitializing, isAuthenticated, user, requires2FA, navigate, from]);

  // --- Lógica del Formulario ---
  const formik = useFormik({
    initialValues: { identificador: "", password: "" },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o usuario"),
      password: Yup.string().required("Ingresá tu contraseña"),
    }),
    onSubmit: async (values) => {
      // Resetear estados visuales antes de la petición
      setResendSuccess(false);
      setIsSessionExpiredRedirect(false);
      setLocalError(null);

      // No llamamos a clearAuthError() aquí para no causar re-renders innecesarios antes del submit

      try {
        await login({
          identificador: values.identificador,
          contraseña: values.password,
        });
        // Si el login es exitoso, el useEffect de redirección (#3) se encarga.
      } catch (err: any) {
        // 🔥 EXTRACCIÓN ROBUSTA DE ERROR
        console.log("Login Error capturado:", err);

        let rawMsg = "Ocurrió un error inesperado.";

        // Prioridad de extracción de mensaje
        if (typeof err === 'string') rawMsg = err;
        else if (err?.message) rawMsg = err.message; // ApiError nuestro
        else if (err?.response?.data?.message) rawMsg = err.response.data.message; // Axios Backend msg
        else if (err?.response?.data?.error) rawMsg = err.response.data.error;

        const msgLower = rawMsg.toLowerCase();
        let type: LocalErrorType = 'generic';

        // Clasificación para mostrar la alerta correcta
        if (
          msgLower.includes('credenciales') ||
          msgLower.includes('incorrect') ||
          msgLower.includes('usuario o contraseña') ||
          msgLower.includes('unauthorized') ||
          msgLower.includes('401')
        ) {
          type = 'invalid_credentials';
          rawMsg = "Usuario o contraseña incorrectos.";
        } else if (
          msgLower.includes('cuenta no activada') ||
          msgLower.includes('verificar') ||
          msgLower.includes('confirmar')
        ) {
          type = 'account_not_activated';
        } else if (
          msgLower.includes('sesión') ||
          msgLower.includes('token')
        ) {
          type = 'session_expired';
        }

        // Establecer estado local para mostrar la alerta roja
        setLocalError({ type, msg: rawMsg });
      }
    },
  });

  const handleResendEmail = async () => {
    setResendSuccess(false);
    try {
      await resendConfirmation(formik.values.identificador);
      setResendSuccess(true);
      // Opcional: Limpiar el error de "no activada" si el reenvío fue exitoso para dar feedback positivo
      setLocalError(null);
    } catch (err) {
      // El error de reenvío se mostrará por el interceptor global o puedes setearlo aquí
    }
  };

  // --- Renderizado de Alertas (Helper) ---
  const renderAlerts = () => {
    // 1. Prioridad: Éxito
    if (resendSuccess) {
      return (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setResendSuccess(false)}>
          ✅ Email reenviado. Revisa tu bandeja de entrada.
        </Alert>
      );
    }

    // 2. Prioridad: Sesión Expirada (Warning)
    if (isSessionExpiredRedirect) {
      return (
        <Alert severity="warning" icon={<LockClock />} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setIsSessionExpiredRedirect(false)}>
          <Typography variant="body2" fontWeight={600}>Tu sesión ha expirado</Typography>
          <Typography variant="body2">Por seguridad, inicia sesión nuevamente.</Typography>
        </Alert>
      );
    }

    // 3. Prioridad: Errores de Login
    if (localError) {
      switch (localError.type) {
        case 'invalid_credentials':
          return (
            <Alert severity="error" icon={<ErrorOutline />} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLocalError(null)}>
              <Typography variant="body2" fontWeight={600}>Credenciales incorrectas</Typography>
              <Typography variant="body2">Verifica tu usuario y contraseña.</Typography>
              <Box mt={1}>
                <Link
                  component="button"
                  variant="caption"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  sx={{ fontWeight: 'bold', textDecoration: 'underline', color: 'error.dark', cursor: 'pointer' }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
            </Alert>
          );

        case 'account_not_activated':
          return (
            <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLocalError(null)}>
              <Typography variant="body2" fontWeight={600}>Cuenta no activada</Typography>
              <Typography variant="body2">Debes confirmar tu email para ingresar.</Typography>
              <Box mt={1}>
                <Link
                  component="button"
                  variant="caption"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  sx={{ fontWeight: 'bold', textDecoration: 'underline', color: 'info.dark', cursor: 'pointer' }}
                >
                  Reenviar correo de confirmación
                </Link>
              </Box>
            </Alert>
          );

        default: // Generic Error
          return (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLocalError(null)}>
              {localError.msg}
            </Alert>
          );
      }
    }

    return null;
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
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <LockOpen fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700}>Iniciar Sesión</Typography>
        </Box>

        {/* Alerta Informativa (Si viene de un link protegido y no hay errores) */}
        {vieneDeProyecto && !isAuthenticated && !localError && !isSessionExpiredRedirect && !resendSuccess && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
            Inicia sesión para ver los detalles del proyecto.
          </Alert>
        )}

        {/* Zona Dinámica de Alertas */}
        {renderAlerts()}

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
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
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
            underline="hover"
            sx={{ cursor: 'pointer' }}
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
              underline="hover"
              sx={{ cursor: 'pointer' }}
            >
              Regístrate
            </Link>
          </Typography>
        </Box>
      </AuthFormContainer>

      {/* Modal para Login de 2 Pasos */}
      <TwoFactorAuthModal
        open={requires2FA}
        onClose={() => { logout(); clearAuthError(); setLocalError(null); }}
        onSubmit={verify2FA}
        isLoading={isLoading}
        error={localError?.type === 'generic' ? localError.msg : undefined}
        title="Verificación en 2 Pasos"
        description="Tu cuenta está protegida. Ingresa el código de tu aplicación autenticadora."
      />
    </>
  );
};

export default LoginPage;