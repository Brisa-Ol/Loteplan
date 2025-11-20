// src/pages/Auth/LoginPage.tsx

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

// Asegúrate de que estas rutas de importación sean correctas en tu proyecto
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extraemos todo lo necesario del Contexto
  const { 
    login, 
    verify2FA, 
    requires2FA, // Estado global que indica si el backend pidió 2FA (202 Accepted)
    error, 
    isLoading, 
    clearError, 
    logout 
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  
  // Mensajes que vienen de redirecciones (ej: registro exitoso)
  const successMessage = location.state?.message;
  const from = (location.state as { from?: string } | null)?.from || "/dashboard"; // Redirige a dashboard por defecto

  // Limpieza automática de mensajes flash
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, navigate, location.pathname]);

  // Configuración del Formulario
  const formik = useFormik({
    initialValues: {
      identificador: "", // Coincide con el Backend (email o usuario)
      password: "",      // Se mapeará a 'contraseña'
      code2FA: "",       // Para el modal
    },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o nombre de usuario"),
      // La contraseña solo es requerida si NO estamos en paso 2FA
      password: requires2FA ? Yup.string() : Yup.string().required("Ingresá tu contraseña"),
      // El código solo es requerido SI estamos en paso 2FA
      code2FA: requires2FA ? Yup.string().required("Ingresá el código 2FA") : Yup.string(),
    }),
    onSubmit: async (values) => {
      clearError();
      try {
        if (!requires2FA) {
          // PASO 1: Login Normal
          await login({
            identificador: values.identificador,
            contraseña: values.password, // ⚠️ Mapeo clave: backend espera 'contraseña'
          });
        } else {
          // PASO 2: Verificación 2FA (si el backend respondió con 202 antes)
          await verify2FA(values.code2FA);
        }
        
        // Si no hubo error (el context maneja el throw), redirigimos
        // Nota: La redirección idealmente ocurre dentro del useEffect que escucha 'isAuthenticated'
        // o aquí si login devuelve promesa resuelta.
        if (!error) navigate(from, { replace: true });

      } catch (err) {
        console.error("Fallo en el proceso de login", err);
      }
    },
  });

  // Cancelar el proceso de 2FA y limpiar estado
  const handleCancel2FA = () => {
    logout(); // Limpia tokens temporales en el context
    formik.setFieldValue("code2FA", "");
    clearError();
  };

  const isDisabled = isLoading;

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus datos para continuar">
        
        {/* Alertas */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && !requires2FA && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Formulario Principal */}
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
              disabled={isDisabled || requires2FA} // Deshabilitar si estamos en 2FA
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

        {/* Links Auxiliares */}
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

      {/* Modal Flotante para 2FA (Solo aparece si requires2FA es true) */}
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