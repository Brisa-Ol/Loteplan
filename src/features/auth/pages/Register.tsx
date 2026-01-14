// src/pages/Auth/Register.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
  Alert,
  Link,
  useTheme,
  alpha
} from "@mui/material";
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";


// ✅ Componentes Reutilizables (Patrón de diseño unificado)
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField/FormTextField";
import { useAuth } from "@/core/context/AuthContext";
import type { RegisterRequestDto } from "@/core/types/dto/auth.dto";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { 
    register, 
    isLoading, 
    isInitializing, 
    error,
    clearError,
    resendConfirmation 
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const validationSchema = Yup.object({
    nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    email: Yup.string().email("Formato inválido").required("Requerido"),
    dni: Yup.string().matches(/^\d+$/, "Solo números").min(7, "Mínimo 7 dígitos").max(8, "Máximo 8 dígitos").required("Requerido"),
    nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("Requerido"),
    numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Mínimo 10 dígitos").required("Requerido"),
    contraseña: Yup.string().min(8, "Mínimo 8 caracteres").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Requiere mayúscula, minúscula y número").required("Requerida"),
    confirmPassword: Yup.string().oneOf([Yup.ref("contraseña")], "Las contraseñas no coinciden").required("Confirma tu contraseña"),
  });

  const formik = useFormik({
    initialValues: {
      nombre: "", apellido: "", email: "", dni: "", 
      nombre_usuario: "", numero_telefono: "", contraseña: "", confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      clearError();
      const data: RegisterRequestDto = {
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email,
        contraseña: values.contraseña,
        dni: values.dni,
        nombre_usuario: values.nombre_usuario,
        numero_telefono: values.numero_telefono,
      };
      try {
        await register(data);
        setRegisteredEmail(values.email);
        setModalOpen(true); 
      } catch (err) {
        // Error manejado por el contexto
      }
    },
  });

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      await resendConfirmation(registeredEmail);
      setResendStatus("Email reenviado correctamente.");
    } catch {
      setResendStatus("Error al reenviar. Intente nuevamente.");
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    if (error && modalOpen) setModalOpen(false);
  }, [error, modalOpen]);

  if (isInitializing) {
    return (
      <Box display="flex" height="100vh" justifyContent="center" alignItems="center" bgcolor="background.default">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      {/* ✅ Usamos AuthFormContainer para el layout completo */}
      <AuthFormContainer
        title="Crea tu Cuenta"
        subtitle="Únete a nuestra comunidad de inversores y ahorristas hoy mismo."
        maxWidth="sm"
      >
        <Box textAlign="center" mb={4}>
          <Box 
            sx={{ 
              width: 56, height: 56, borderRadius: '50%', 
              bgcolor: alpha(theme.palette.primary.main, 0.1), 
              color: 'primary.main', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              mx: 'auto', mb: 2
            }}
          >
            <PersonAdd fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Regístrate
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completa el formulario para comenzar
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            
            {/* Fila: Nombre y Apellido */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormTextField name="nombre" label="Nombre" formik={formik} disabled={isLoading} />
              <FormTextField name="apellido" label="Apellido" formik={formik} disabled={isLoading} />
            </Box>

            <FormTextField name="email" label="Email" type="email" formik={formik} disabled={isLoading} />

            {/* Fila: DNI y Teléfono */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {/* Nota: Usamos FormTextField. La validación numérica la maneja Yup (schema) */}
              <FormTextField name="dni" label="DNI" formik={formik} disabled={isLoading} />
              <FormTextField name="numero_telefono" label="Teléfono" formik={formik} disabled={isLoading} />
            </Box>

            <FormTextField name="nombre_usuario" label="Usuario" formik={formik} disabled={isLoading} />

            <FormTextField
              name="contraseña"
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

            <FormTextField
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              formik={formik}
              disabled={isLoading}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={isLoading}
              sx={{ 
                py: 1.5, fontWeight: 700, mt: 2, borderRadius: 2, boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "REGISTRARSE"}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes cuenta?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/login")}
              underline="hover"
              fontWeight={700}
              color="primary"
            >
              Inicia sesión aquí
            </Link>
          </Typography>
        </Box>
      </AuthFormContainer>

      {/* Modal Éxito */}
      <Dialog 
        open={modalOpen} 
        onClose={handleClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem' }}>
          ¡Bienvenido! 🎉
        </DialogTitle>
        <DialogContent>
          <DialogContentText textAlign="center" sx={{ fontSize: '1rem', mb: 2 }}>
            Hemos enviado un enlace de confirmación a <strong>{registeredEmail}</strong>.
            <br />Por favor activa tu cuenta para ingresar.
          </DialogContentText>
          
          {resendStatus && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>{resendStatus}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, flexDirection: 'column', gap: 1 }}>
          <Button 
            onClick={handleClose} 
            variant="contained" 
            fullWidth 
            size="large"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Ir al Login
          </Button>
          <Button 
            onClick={handleResend} 
            disabled={resending} 
            size="small" 
            sx={{ textTransform: 'none' }}
          >
            {resending ? "Enviando..." : "No recibí el email, reenviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Register;