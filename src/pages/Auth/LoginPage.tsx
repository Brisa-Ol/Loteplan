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
  Typography
} from "@mui/material";
import { Visibility, VisibilityOff, InfoOutlined } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import TwoFactorAuthModal from "../../components/common/TwoFactorAuthModal/TwoFactorAuthModal";
import FormTextField from "./components/FormTextField/FormTextField";
import { useAuth } from "../../context/AuthContext";

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

  const [showPassword, setShowPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Manejo seguro del estado de navegación
  const state = location.state as { from?: string | { pathname: string }; message?: string } | null;
  const from = typeof state?.from === 'string' 
    ? state.from 
    : (state?.from as any)?.pathname || '/';
  
  const successMessage = state?.message;
  const vieneDeProyecto = from.includes('/proyectos/');

  // --- REDIRECCIÓN INTELIGENTE ---
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

  // --- DETECCIÓN DE CUENTA NO ACTIVADA ---
  useEffect(() => {
    if (error && (error.includes('Cuenta no activada') || error.includes('no confirmado'))) {
      setShowResendEmail(true);
    } else {
      setShowResendEmail(false);
    }
  }, [error]);

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
        // El error ya se setea en el contexto
      }
    },
  });

  const handleResendEmail = async () => {
    try {
      await resendConfirmation(formik.values.identificador);
      setResendSuccess(true);
      setShowResendEmail(false);
    } catch (err) {
      // Error manejado por contexto
    }
  };

  const handleCancel2FA = () => {
    logout(); // Limpia estado y redirige
    clearError();
  };

  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus credenciales para continuar">
        
        {/* Alertas Contextuales */}
        {vieneDeProyecto && !isAuthenticated && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3 }}>
            Inicia sesión para ver los detalles y lotes del proyecto.
          </Alert>
        )}

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        
        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Email reenviado. Revisa tu bandeja de entrada.
          </Alert>
        )}

        {error && !requires2FA && (
          <Alert severity={error.includes('Cuenta no activada') ? 'warning' : 'error'} sx={{ mb: 3 }} onClose={clearError}>
            {error}
            {showResendEmail && (
              <Box mt={1}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleResendEmail}
                  sx={{ fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  Reenviar email de confirmación
                </Link>
              </Box>
            )}
          </Alert>
        )}

        {/* Formulario */}
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
              sx={{ mt: 1, py: 1.5, fontWeight: 700 }}
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