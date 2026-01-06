// src/pages/Auth/LoginPage.tsx

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
  Typography
} from "@mui/material";
import { Visibility, VisibilityOff, InfoOutlined } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

// Contexto y Componentes
import { useAuth } from "../../context/AuthContext";
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import TwoFactorAuthModal from "../../components/common/TwoFactorAuthModal/TwoFactorAuthModal";
import FormTextField from "./components/FormTextField/FormTextField";

// Interfaz para el estado de navegación
interface LocationState {
  from?: { pathname: string } | string;
  message?: string;
}

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

  // Estados Locales
  const [showPassword, setShowPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Lógica de Navegación (Redirección post-login)
  const state = location.state as LocationState;
  const from = useMemo(() => {
    if (!state?.from) return '/';
    return typeof state.from === 'string' ? state.from : state.from.pathname;
  }, [state]);

  const successMessage = state?.message;
  const vieneDeProyecto = from.includes('/proyectos/');

  // 1. Efecto: Redirección si ya está autenticado
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user && !requires2FA) {
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else {
        const dashboard = user.rol === 'admin' ? '/admin/dashboard' : '/client/dashboard';
        navigate(dashboard, { replace: true });
      }
    }
  }, [isInitializing, isAuthenticated, user, requires2FA, navigate, from]);

  // 2. Efecto: Detectar error de cuenta no activada
  useEffect(() => {
    if (error && (error.toLowerCase().includes('cuenta no activada') || error.toLowerCase().includes('no confirmado'))) {
      setShowResendEmail(true);
    } else {
      setShowResendEmail(false);
    }
  }, [error]);

  // Formulario
  const formik = useFormik({
    initialValues: {
      identificador: "",
      password: "",
    },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o usuario"),
      password: Yup.string().required("Ingresá tu contraseña"),
    }),
    onSubmit: async (values) => {
      clearError();
      setShowResendEmail(false);
      setResendSuccess(false);
      try {
        await login({
          identificador: values.identificador,
          contraseña: values.password,
        });
      } catch (err) {
        // El error es manejado por el AuthContext y se refleja en la variable `error`
      }
    },
  });

  // Handlers
  const handleResendEmail = async () => {
    try {
      await resendConfirmation(formik.values.identificador);
      setResendSuccess(true);
      setShowResendEmail(false);
      clearError(); // Limpiamos el error original para mostrar el éxito
    } catch (err) {
      // Error manejado por contexto
    }
  };

  const handleCancel2FA = () => {
    logout(); 
    clearError();
  };

  // Render: Loading Inicial
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Render: Formulario
  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus credenciales para continuar">
        
        {/* Alertas Contextuales */}
        {vieneDeProyecto && !isAuthenticated && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
            Inicia sesión para ver los detalles y lotes del proyecto.
          </Alert>
        )}

        {successMessage && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMessage}</Alert>
        )}
        
        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            Email reenviado. Revisa tu bandeja de entrada.
          </Alert>
        )}

        {error && !requires2FA && !resendSuccess && (
          <Alert 
            severity={showResendEmail ? 'warning' : 'error'} 
            sx={{ mb: 3, borderRadius: 2 }} 
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
                >
                  Reenviar email de confirmación
                </Link>
              </Box>
            )}
          </Alert>
        )}

        {/* Inputs */}
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            <FormTextField
              fullWidth
              name="identificador"
              label="Email o Usuario"
              formik={formik}
              disabled={isLoading}
            />

            <FormTextField
              fullWidth
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
              sx={{ mt: 1, py: 1.5, fontWeight: 700, borderRadius: 2 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "INGRESAR"}
            </Button>
          </Stack>
        </form>

        {/* Footer Links */}
        <Box textAlign="center" mt={3} display="flex" flexDirection="column" gap={1}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/forgot-password")}
            underline="hover"
            color="text.secondary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/register")}
              underline="hover"
              fontWeight="bold"
              color="primary"
            >
              Regístrate
            </Link>
          </Typography>
        </Box>

      </AuthFormContainer>

      {/* Modal 2FA */}
      <TwoFactorAuthModal
        open={requires2FA}
        onClose={handleCancel2FA}
        onSubmit={verify2FA}
        isLoading={isLoading}
        error={error}
        title="Verificación en 2 Pasos"
        description="Tu cuenta está protegida. Ingresa el código de tu autenticador."
      />
    </PageContainer>
  );
};

export default LoginPage;