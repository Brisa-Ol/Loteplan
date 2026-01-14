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
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { Visibility, VisibilityOff, InfoOutlined, LockOpen } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";


import TwoFactorAuthModal from "../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal";

// ✅ Importamos los nuevos componentes refactorizados
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField/FormTextField";
import { useAuth } from "@/core/context/AuthContext";


interface LocationState {
  from?: { pathname: string } | string;
  message?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Hooks de Autenticación
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

  // Lógica de Navegación
  const state = location.state as LocationState;
  const from = useMemo(() => {
    if (!state?.from) return '/admin/dashboard';
    return typeof state.from === 'string' ? state.from : state.from.pathname;
  }, [state]);

  const successMessage = state?.message;
  const vieneDeProyecto = from.includes('/proyectos/');

  // Efectos
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

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

  useEffect(() => {
    if (error && (error.toLowerCase().includes('cuenta no activada') || error.toLowerCase().includes('no confirmado'))) {
      setShowResendEmail(true);
    } else {
      setShowResendEmail(false);
    }
  }, [error]);

  // Formulario Formik
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
      setShowResendEmail(false);
      setResendSuccess(false);
      clearError();
      try {
        await login({
          identificador: values.identificador,
          contraseña: values.password,
        });
      } catch (err) {
        // Error manejado por el contexto
      }
    },
  });

  // Handlers
  const handleResendEmail = async () => {
    setResendSuccess(false);
    try {
      await resendConfirmation(formik.values.identificador);
      setResendSuccess(true);
      setShowResendEmail(false);
      clearError();
    } catch (err) {
      // Error manejado por el contexto
    }
  };

  const handleCancel2FA = () => {
    logout();
    clearError();
  };

  // Render: Loading
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      {/* ✅ AuthFormContainer maneja el Hero Header y la Tarjeta Blanca */}
      <AuthFormContainer
        title="¡Hola de nuevo!"
        subtitle="Ingresá a tu cuenta para gestionar tus inversiones y proyectos."
      >
        <Box textAlign="center" mb={4}>
          <Box 
            sx={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.primary.main, 0.1), 
              color: 'primary.main',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}
          >
            <LockOpen fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Iniciar Sesión
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completa tus credenciales para continuar
          </Typography>
        </Box>

        {/* --- ALERTAS --- */}
        {vieneDeProyecto && !isAuthenticated && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
            Inicia sesión para ver los detalles y lotes del proyecto.
          </Alert>
        )}

        {(successMessage || resendSuccess) && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {successMessage || "Email reenviado. Revisa tu bandeja de entrada."}
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
                  sx={{ fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', color: 'inherit' }}
                >
                  Reenviar email de confirmación
                </Link>
              </Box>
            )}
          </Alert>
        )}

        {/* --- FORMULARIO --- */}
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            
            {/* ✅ Usamos FormTextField para simplificar */}
            <FormTextField
              name="identificador"
              label="Email o Usuario"
              placeholder="ejemplo@correo.com"
              formik={formik}
              disabled={isLoading}
            />

            <FormTextField
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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
              sx={{ 
                py: 1.5, 
                fontWeight: 700, 
                fontSize: '1rem',
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "INGRESAR"}
            </Button>
          </Stack>
        </form>

        {/* Footer Links */}
        <Box textAlign="center" mt={4} display="flex" flexDirection="column" gap={1.5}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/forgot-password")}
            underline="hover"
            color="text.secondary"
            fontWeight={500}
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
              fontWeight={700}
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
    </>
  );
};

export default LoginPage;