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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    login, 
    verify2FA, 
    requires2FA, 
    error, 
    isLoading, 
    isInitializing, // ✅ IMPORTANTE: Nuevo estado del contexto
    clearError, 
    logout, 
    user,
    isAuthenticated
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const successMessage = location.state?.message;
  const from = (location.state as { from?: string } | null)?.from;

  // ─────────────────────────────────────────────────────────────
  // 1. REDIRECCIÓN INTELIGENTE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Solo redirigimos si YA terminó de inicializar y está autenticado sin 2FA pendiente
    if (!isInitializing && isAuthenticated && user && !requires2FA) {
      
      // A. Si intentó entrar a una ruta protegida, lo devolvemos ahí
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // B. Redirección por Rol (Coincide con useNavbarMenu)
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

  // ─────────────────────────────────────────────────────────────
  // 2. FORMIK (Manejo del formulario)
  // ─────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: {
      identificador: "",
      password: "",
      code2FA: "",
    },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o nombre de usuario"),
      password: requires2FA ? Yup.string() : Yup.string().required("Ingresá tu contraseña"),
      code2FA: requires2FA ? Yup.string().required("Ingresá el código 2FA") : Yup.string(),
    }),
    onSubmit: async (values) => {
      clearError();
      try {
        if (!requires2FA) {
          // Paso 1: Login normal
          await login({
            identificador: values.identificador,
            contraseña: values.password,
          });
        } else {
          // Paso 2: Verificar 2FA
          await verify2FA(values.code2FA);
        }
      } catch (err) {
        console.error("Fallo en el proceso de login", err);
      }
    },
  });

  const handleCancel2FA = () => {
    logout(); // Esto limpiará el estado requires2FA y recargará la página
    formik.resetForm();
    clearError();
  };

  // Bloqueamos inputs si está cargando o inicializando
  const isDisabled = isLoading || isInitializing;

  // ─────────────────────────────────────────────────────────────
  // 3. RENDERIZADO CONDICIONAL (Evita parpadeos)
  // ─────────────────────────────────────────────────────────────
  
  // Si estamos comprobando el token en localStorage, mostramos loader
  if (isInitializing) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          height: '100vh', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus datos para continuar">
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Solo mostramos error si NO estamos en el modal de 2FA */}
        {error && !requires2FA && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
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
              {isLoading && !requires2FA ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Ingresar"
              )}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={3}>
          <Button
            onClick={() => navigate("/register")}
            sx={{ textTransform: "none" }}
            disabled={isDisabled}
          >
            ¿No tienes cuenta? Regístrate
          </Button>
          <br />
          <Button
            onClick={() => navigate("/forgot-password")}
            sx={{ textTransform: "none", mt: 1 }}
            color="secondary"
            disabled={isDisabled}
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </Box>
      </AuthFormContainer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2FA
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={requires2FA} onClose={handleCancel2FA}>
        <DialogTitle>Verificación de Seguridad</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Tu cuenta tiene activada la autenticación de dos factores.
              Ingresa el código de 6 dígitos de tu aplicación.
            </DialogContentText>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              autoFocus
              fullWidth
              id="code2FA"
              name="code2FA"
              label="Código 2FA"
              placeholder="000000"
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4 } }}
              value={formik.values.code2FA}
              onChange={formik.handleChange}
              error={formik.touched.code2FA && Boolean(formik.errors.code2FA)}
              helperText={formik.touched.code2FA && formik.errors.code2FA}
              disabled={isLoading}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCancel2FA} color="inherit" disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? <CircularProgress size={20} /> : "Verificar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
};

export default LoginPage;