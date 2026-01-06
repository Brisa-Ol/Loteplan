// src/pages/Auth/LoginPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  InputAdornment,
  IconButton,
  Alert, // ✅ Usamos Alert para feedback inline
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
import { useAuth } from "../../context/AuthContext"; // ✅ Hook unificado
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

  // ✅ Extraemos todo del hook useAuth (que usa useAuthCore + use2FAManagement internamente)
  const {
    login,
    verify2FA,
    requires2FA,
    error,           // Error global del contexto
    isLoading,
    isInitializing,
    clearError,
    logout,
    user,
    isAuthenticated,
    resendConfirmation
  } = useAuth();

  // Estados Locales de UI
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

  // 1. Efecto: Limpieza al desmontar o cambiar
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // 2. Efecto: Redirección si ya está autenticado y no requiere 2FA
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

  // 3. Efecto: Detectar error específico para mostrar botón de "Reenviar Email"
  useEffect(() => {
    // Si el contexto tiene un error y es sobre cuenta no activada
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
      // Limpiamos estados visuales locales
      setShowResendEmail(false);
      setResendSuccess(false);
      clearError(); 

      try {
        // useAuthCore maneja el error internamente y setea el estado 'error'
        // Si requiere 2FA, el contexto setea 'requires2FA' a true
        await login({
          identificador: values.identificador,
          contraseña: values.password,
        });
      } catch (err) {
        // No necesitamos hacer nada aquí, el 'error' del contexto disparará el Alert en el JSX
      }
    },
  });

  // Handlers
  const handleResendEmail = async () => {
    setResendSuccess(false);
    try {
      await resendConfirmation(formik.values.identificador);
      
      // Si tuvo éxito:
      setResendSuccess(true);
      setShowResendEmail(false);
      clearError(); // Quitamos el error rojo de "cuenta no activada" para mostrar el verde de éxito
    } catch (err) {
      // Si falla, el contexto setea 'error' y se mostrará en el Alert rojo
    }
  };

  const handleCancel2FA = () => {
    logout(); // Resetea el estado temporal de 2FA en el contexto
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
        
        {/* --- ALERTAS INLINE --- */}

        {/* 1. Alerta Informativa (vengo de ruta protegida) */}
        {vieneDeProyecto && !isAuthenticated && (
          <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
            Inicia sesión para ver los detalles y lotes del proyecto.
          </Alert>
        )}

        {/* 2. Alerta de Éxito (redirección o reenvío) */}
        {(successMessage || resendSuccess) && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {successMessage || "Email reenviado. Revisa tu bandeja de entrada."}
            </Alert>
        )}
        
        {/* 3. Alerta de Error (Login fallido o Error de reenvío) */}
        {/* Solo mostramos si NO hay 2FA activo (el modal tiene su propio manejo) y NO hubo éxito reciente */}
        {error && !requires2FA && !resendSuccess && (
          <Alert 
            severity={showResendEmail ? 'warning' : 'error'} 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={clearError}
          >
            {error}
            
            {/* Botón condicional para reenviar email dentro de la alerta */}
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
        error={error} // Pasamos el error al modal para que lo muestre dentro
        title="Verificación en 2 Pasos"
        description="Tu cuenta está protegida. Ingresa el código de tu autenticador."
      />
    </PageContainer>
  );
};

export default LoginPage;