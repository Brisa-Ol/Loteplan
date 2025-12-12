import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  CircularProgress,
  Box,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

// Componentes y Contexto
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import TwoFactorAuthModal from "../../components/common/TwoFactorAuthModal/TwoFactorAuthModal"; // ✅ Importado

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
    isAuthenticated
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const successMessage = location.state?.message;
  const from = (location.state as { from?: string } | null)?.from;

  // 1. REDIRECCIÓN INTELIGENTE
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

  // Limpieza de mensaje flash
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, navigate, location.pathname]);

  // 2. FORMIK (Solo Login Básico)
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
      try {
         // Si el backend pide 2FA, 'requires2FA' pasará a true automáticamente
         await login({
           identificador: values.identificador,
           contraseña: values.password,
         });
      } catch (err) {
        console.error("Fallo en login", err);
      }
    },
  });

  // Handlers para el Modal 2FA
  const handleVerify2FA = async (code: string) => {
    try {
      await verify2FA(code);
    } catch (err) {
      // El error se setea en el contexto 'error' automáticamente
    }
  };

  const handleCancel2FA = () => {
    logout(); // Limpia estado y token temporal
    clearError();
  };

  const isDisabled = isLoading || isInitializing;

  // Renderizado Condicional de Carga
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus datos para continuar">
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
        )}

        {/* Mostrar error solo si NO estamos en el paso de 2FA (allí lo muestra el modal) */}
        {error && !requires2FA && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              id="identificador"
              name="identificador"
              label="Email o Nombre de Usuario"
              value={formik.values.identificador}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.identificador && Boolean(formik.errors.identificador)}
              helperText={formik.touched.identificador && formik.errors.identificador}
              disabled={isDisabled || requires2FA}
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={isDisabled || requires2FA}
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
              disabled={isDisabled}
              size="large"
              sx={{ mt: 2 }}
            >
              {isLoading && !requires2FA ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={3}>
          <Button onClick={() => navigate("/register")} sx={{ textTransform: "none" }} disabled={isDisabled}>
            ¿No tienes cuenta? Regístrate
          </Button>
          <br />
          <Button onClick={() => navigate("/forgot-password")} sx={{ textTransform: "none", mt: 1 }} color="secondary" disabled={isDisabled}>
            ¿Olvidaste tu contraseña?
          </Button>
        </Box>
      </AuthFormContainer>

      {/* ✅ MODAL REUTILIZABLE PARA LOGIN CON 2FA */}
      <TwoFactorAuthModal
        open={requires2FA}
        onClose={handleCancel2FA}
        onSubmit={handleVerify2FA}
        isLoading={isLoading}
        error={error} // El error de "Código incorrecto" viene del contexto
        title="Login Seguro"
        description="Tu cuenta está protegida con verificación en dos pasos. Ingresa el código de tu aplicación."
      />
    </PageContainer>
  );
};

export default LoginPage;