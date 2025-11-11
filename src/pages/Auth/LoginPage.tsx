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
import { PageContainer } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verify2FA, requires2FA, error, isLoading, clearError, logout } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const successMessage = location.state?.message;
  const from = (location.state as { from?: string } | null)?.from || "/";

  // 🔹 Limpieza del mensaje de éxito tras 5 segundos
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, navigate, location.pathname]);

  // 🔹 Configuración Formik + Yup
  const formik = useFormik({
    initialValues: {
      identificador: "", // Puede ser email o nombre de usuario
      password: "",
      code2FA: "",
    },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o nombre de usuario"),
      password: requires2FA ? Yup.string() : Yup.string().required("Ingresá tu contraseña"),
      code2FA: requires2FA ? Yup.string().required("Ingresá el código 2FA") : Yup.string(),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      clearError();
      try {
        if (!requires2FA) {
          await login({
            identificador: values.identificador,
            contraseña: values.password,
          });
        } else {
          await verify2FA(values.code2FA);
        }

        if (!error) navigate(from, { replace: true });
      } catch (err) {
        console.error("Error en login/2FA:", err);
      }
    },
  });

  const handleCancel2FA = () => {
    logout();
    formik.resetForm();
    clearError();
  };

  const isDisabled = isLoading || requires2FA;

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Iniciar Sesión" subtitle="Ingresá tus datos para continuar">
        {/* ✅ Mensaje de éxito */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* ⚠️ Error al iniciar sesión */}
        {error && !requires2FA && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* 🧾 Formulario principal */}
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={1}>
            <TextField
              fullWidth
              label="Email o Nombre de Usuario"
              margin="normal"
              {...formik.getFieldProps("identificador")}
              error={formik.touched.identificador && Boolean(formik.errors.identificador)}
              helperText={formik.touched.identificador && formik.errors.identificador}
              disabled={isDisabled}
            />

            <TextField
              fullWidth
              label="Contraseña"
              margin="normal"
              type={showPassword ? "text" : "password"}
              {...formik.getFieldProps("password")}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={isDisabled}
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
              sx={{ mt: 3, py: 1.2 }}
            >
              {isLoading && !requires2FA ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Ingresar"
              )}
            </Button>
          </Stack>
        </form>

        {/* 🔹 Enlaces auxiliares */}
        <Box textAlign="center" mt={3}>
          <Button
            onClick={() => navigate("/register")}
            sx={{
              textTransform: "none",
              color: "primary.main",
              fontWeight: 500,
            }}
            disabled={isLoading}
          >
            ¿No tienes cuenta? Regístrate
          </Button>
        </Box>

        <Box textAlign="center" mt={1}>
          <Button
            onClick={() => navigate("/forgot-password")}
            sx={{
              textTransform: "none",
              color: "primary.main",
              fontWeight: 500,
            }}
            disabled={isLoading}
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </Box>
      </AuthFormContainer>

      {/* 🔐 Diálogo 2FA */}
      <Dialog open={requires2FA} onClose={handleCancel2FA}>
        <DialogTitle>Verificación en Dos Pasos</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <DialogContentText>
                Ingresa el código de tu aplicación de autenticación para continuar.
              </DialogContentText>

              {error && requires2FA && (
                <Alert severity="error" onClose={clearError}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Código 2FA"
                margin="normal"
                placeholder="123456"
                {...formik.getFieldProps("code2FA")}
                error={formik.touched.code2FA && Boolean(formik.errors.code2FA)}
                helperText={formik.touched.code2FA && formik.errors.code2FA}
                autoFocus
                disabled={isLoading}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCancel2FA} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Verificar"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
};

export default LoginPage;
