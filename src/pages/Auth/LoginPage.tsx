// src/pages/Auth/LoginPage.tsx

import React, { useState, useEffect } from "react";
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
  Snackbar,
  Typography
} from "@mui/material";
import { Visibility, VisibilityOff, InfoOutlined } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

// Componentes comunes
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import TwoFactorAuthModal from "../../components/common/TwoFactorAuthModal/TwoFactorAuthModal";

// Contexto
import { useAuth } from "../../context/AuthContext";
import FormTextField from "./components/FormTextField/FormTextField";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    verify2FA,
    requires2FA,
    error,
    isLoading,
    isInitializing,
    clearError,
    logout,
    user,
    isAuthenticated,
    resendConfirmation
  } = useAuth();

  // Estados locales
  const [showPassword, setShowPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [emailForResend, setEmailForResend] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  // --- CORRECCIÓN AQUÍ ---
  // Recuperamos el estado de forma segura
  const state = location.state as { from?: string | { pathname: string }; message?: string } | null;
  
  // Extraemos 'from'. Si es un objeto, tomamos .pathname. Si es string, lo usamos directo.
  const rawFrom = state?.from;
  const from = typeof rawFrom === 'string' 
    ? rawFrom 
    : (rawFrom as any)?.pathname || null;

  const successMessage = state?.message;
  // Ahora 'from' es seguro (string o null), por lo que .includes funcionará
  const vieneDeProyecto = from && from.includes('/proyectos/');
  // -----------------------

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      identificador: "",
      password: "",
    },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o nombre de usuario"),
      password: Yup.string().required("Ingresá tu contraseña"),
    }),
    onSubmit: async (values) => {
      clearError();
      setShowResendEmail(false);
      try {
        await login({
          identificador: values.identificador,
          contraseña: values.password,
        });
      } catch (err) {
        console.error("Fallo en login", err);
      }
    },
  });

  // 1. Redirección inteligente basada en rol y origen
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user && !requires2FA) {
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      if (user.rol === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.rol === 'cliente') {
        navigate('/client/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isInitializing, isAuthenticated, user, requires2FA, navigate, from]);

  // 2. Detector de error "Cuenta no activada"
  useEffect(() => {
    if (error && (error.includes('Cuenta no activada') || error.includes('no confirmado'))) {
      setShowResendEmail(true);
      setEmailForResend(formik.values.identificador);
    } else {
      setShowResendEmail(false);
    }
  }, [error, formik.values.identificador]);

  // 3. Limpieza de mensajes flash (successMessage)
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, navigate, location.pathname]);

  // Handlers
  const handleResendEmail = async () => {
    try {
      await resendConfirmation(emailForResend);
      setResendSuccess(true);
      setShowResendEmail(false);
    } catch (err) {
      console.error('Error al reenviar email:', err);
    }
  };

  const handleVerify2FA = async (code: string) => {
    try {
      await verify2FA(code);
    } catch (err) {
      // El error lo maneja el context
    }
  };

  const handleCancel2FA = () => {
    logout();
    clearError();
  };

  const isDisabled = isLoading || isInitializing;

  // Render Loader Inicial
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus datos para continuar">

        {/* Alerta Informativa (si viene de ver un proyecto) */}
        {vieneDeProyecto && !error && !successMessage && (
          <Alert
            severity="info"
            icon={<InfoOutlined />}
            sx={{ mb: 3, alignItems: 'center' }}
          >
            <Typography variant="body2" fontWeight={500}>
              Para ver los detalles completos del proyecto y los lotes disponibles, por favor inicia sesión o registrate.
            </Typography>
          </Alert>
        )}

        {/* Mensaje de Éxito (ej: registro completado) */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
        )}

        {/* Manejo de Errores de Login */}
        {error && !requires2FA && (
          <Alert
            severity={error.includes('Cuenta no activada') ? 'warning' : 'error'}
            sx={{ mb: 2 }}
            onClose={clearError}
          >
            {error}
            {showResendEmail && (
              <Box mt={1}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleResendEmail}
                  sx={{ fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                  color="inherit"
                >
                  Reenviar email de confirmación
                </Link>
              </Box>
            )}
          </Alert>
        )}

        {/* Formulario */}
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            
            {/* Campo Usuario/Email usando FormTextField */}
            <FormTextField
              fullWidth
              name="identificador"
              label="Email o Nombre de Usuario"
              formik={formik}
              disabled={isDisabled || requires2FA}
            />

            {/* Campo Password usando FormTextField */}
            <FormTextField
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              formik={formik}
              disabled={isDisabled || requires2FA}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setShowPassword(!showPassword)} 
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Botón de Submit */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={isDisabled}
              size="large"
            >
              {isLoading && !requires2FA ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
            </Button>
          </Stack>
        </form>

        {/* Links de Navegación */}
        <Box textAlign="center" mt={3} display="flex" flexDirection="column" gap={1}>
          <Button
            onClick={() => navigate("/forgot-password")}
            disabled={isDisabled}
            color="inherit"
            sx={{ fontWeight: 500, textTransform: 'none' }}
          >
            ¿Olvidaste tu contraseña?
          </Button>

          <Button
            onClick={() => navigate("/register")}
            disabled={isDisabled}
            color="primary"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            ¿No tienes cuenta? Regístrate
          </Button>
        </Box>

      </AuthFormContainer>

      {/* Modal 2FA */}
      <TwoFactorAuthModal
        open={requires2FA}
        onClose={handleCancel2FA}
        onSubmit={handleVerify2FA}
        isLoading={isLoading}
        error={error}
        title="Login Seguro"
        description="Tu cuenta está protegida con verificación en dos pasos. Ingresa el código de tu aplicación."
      />

      {/* Snackbar para reenvío de email */}
      <Snackbar
        open={resendSuccess}
        autoHideDuration={6000}
        onClose={() => setResendSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setResendSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Email de confirmación reenviado. Revisa tu bandeja de entrada.
        </Alert>
      </Snackbar>

    </PageContainer>
  );
};

export default LoginPage;