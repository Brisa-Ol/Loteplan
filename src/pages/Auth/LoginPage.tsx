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
  Link,
  Snackbar 
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import TwoFactorAuthModal from "../../components/common/TwoFactorAuthModal/TwoFactorAuthModal";

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
  const [emailForResend, setEmailForResend] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const successMessage = location.state?.message;
  const from = (location.state as { from?: string } | null)?.from;

  // 🔽 1. MOVEMOS FORMIK AQUÍ ARRIBA (Antes de los useEffects)
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

  // 🔽 2. AHORA SÍ PODEMOS USAR 'formik' EN LOS EFFECTS

  // Redirección inteligente
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

  // Detector de error de cuenta no activada
  useEffect(() => {
    if (error && (error.includes('Cuenta no activada') || error.includes('no confirmado'))) {
      setShowResendEmail(true);
      // ✅ Ahora 'formik' ya está definido aquí
      setEmailForResend(formik.values.identificador);
    } else {
      setShowResendEmail(false);
    }
  }, [error, formik.values.identificador]); // ✅ Y aquí también

  // Limpieza de mensaje flash
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage, navigate, location.pathname]);

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
      // El error se maneja en el contexto
    }
  };

  const handleCancel2FA = () => {
    logout();
    clearError();
  };

  const isDisabled = isLoading || isInitializing;

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
                  sx={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                  color="inherit"
                >
                  Reenviar email de confirmación
                </Link>
              </Box>
            )}
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

      <TwoFactorAuthModal
        open={requires2FA}
        onClose={handleCancel2FA}
        onSubmit={handleVerify2FA}
        isLoading={isLoading}
        error={error}
        title="Login Seguro"
        description="Tu cuenta está protegida con verificación en dos pasos. Ingresa el código de tu aplicación."
      />

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