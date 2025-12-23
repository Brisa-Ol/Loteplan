// src/pages/Auth/Register.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  TextField, // Mantenemos este import para DNI/Telefono
  Box,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";

import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import type { RegisterRequestDto } from "../../types/dto/auth.dto";
import FormTextField from "./components/FormTextField/FormTextField";


const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    isLoading,
    isInitializing,
    error,
    clearError,
    resendConfirmation,
    user,
    isAuthenticated
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const successMessage = location.state?.message;

  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      if (user.rol === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.rol === 'cliente') {
        navigate('/client/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isInitializing, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate, location.pathname]);

  const formik = useFormik({
    initialValues: {
      nombre: "",
      apellido: "",
      email: "",
      dni: "",
      nombre_usuario: "",
      numero_telefono: "",
      contraseña: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      nombre: Yup.string().min(2, "Muy corto").required("Requerido"),
      apellido: Yup.string().min(2, "Muy corto").required("Requerido"),
      email: Yup.string().email("Email inválido").required("Requerido"),
      dni: Yup.string()
        .matches(/^\d+$/, "Solo números")
        .min(7, "DNI inválido")
        .max(8, "DNI inválido")
        .required("Requerido"),
      nombre_usuario: Yup.string()
        .min(4, "Mínimo 4 caracteres")
        .required("Requerido"),
      numero_telefono: Yup.string()
        .matches(/^\d+$/, "Solo números")
        .min(10, "Mínimo 10 dígitos")
        .required("Requerido"),
      contraseña: Yup.string()
        .min(8, "Mínimo 8 caracteres")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe tener mayúscula, minúscula y número")
        .required("Requerida"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("contraseña")], "Las contraseñas no coinciden")
        .required("Confirma tu contraseña"),
    }),
    onSubmit: async (values) => {
      clearError();
      try {
        const data: RegisterRequestDto = {
          nombre: values.nombre,
          apellido: values.apellido,
          email: values.email,
          contraseña: values.contraseña,
          dni: values.dni,
          nombre_usuario: values.nombre_usuario,
          numero_telefono: values.numero_telefono,
        };

        await register(data);

        setRegisteredEmail(values.email);
        setIsModalOpen(true);
        setModalMessage(null);
      } catch (err) {
        console.error("Error registro:", err);
      }
    },
  });

  const handleResendEmail = async () => {
    setModalMessage(null);
    setIsResending(true);
    try {
      await resendConfirmation(registeredEmail);
      setModalMessage({ type: "success", text: "¡Email reenviado con éxito!" });
    } catch {
      setModalMessage({ type: "error", text: "No se pudo reenviar el email." });
    } finally {
      setIsResending(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate("/login");
  };

  const isDisabled = isLoading || isInitializing;

  if (isInitializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer
        title="Crear Cuenta"
        subtitle="Únete a nuestra plataforma de inversión"
        maxWidth={600}
      >
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>{error}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>

            <Box display="flex" gap={2}>
              {/* ✅ Usamos FormTextField para campos estándar */}
              <FormTextField
                fullWidth
                name="nombre"
                label="Nombre"
                formik={formik}
                disabled={isDisabled}
              />
              <FormTextField
                fullWidth
                name="apellido"
                label="Apellido"
                formik={formik}
                disabled={isDisabled}
              />
            </Box>

            <FormTextField
              fullWidth
              name="email"
              label="Email"
              type="email"
              formik={formik}
              disabled={isDisabled}
            />

            <Box display="flex" gap={2}>
              {/* ⚠️ Mantenemos TextField normal para DNI y Teléfono porque tienen lógica custom en onChange */}
              <TextField
                fullWidth
                label="DNI"
                {...formik.getFieldProps("dni")}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  formik.setFieldValue("dni", val);
                }}
                error={formik.touched.dni && Boolean(formik.errors.dni)}
                helperText={formik.touched.dni && formik.errors.dni}
                disabled={isDisabled}
              />
              <TextField
                fullWidth
                label="Teléfono"
                {...formik.getFieldProps("numero_telefono")}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                  formik.setFieldValue("numero_telefono", val);
                }}
                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                disabled={isDisabled}
              />
            </Box>

            <FormTextField
              fullWidth
              name="nombre_usuario"
              label="Nombre de Usuario"
              formik={formik}
              disabled={isDisabled}
            />

            <FormTextField
              fullWidth
              name="contraseña"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              formik={formik}
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

            <FormTextField
              fullWidth
              name="confirmPassword"
              label="Confirmar Contraseña"
              type={showConfirmPassword ? "text" : "password"}
              formik={formik}
              disabled={isDisabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
              disabled={isDisabled}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "Registrarse"}
            </Button>

            <Box textAlign="center">
              <Button
                onClick={() => navigate("/login")}
                disabled={isDisabled}
                color="primary"
                sx={{ fontWeight: 500 }}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Button>
            </Box>
          </Stack>
        </form>
      </AuthFormContainer>

      {/* Modal de Confirmación */}
      <Dialog
        open={isModalOpen}
        onClose={() => { }}
        PaperProps={{ sx: { borderRadius: 3, padding: 1 } }}
      >
        <DialogTitle variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          ¡Registro Exitoso!
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center' }}>
            Hemos enviado un correo de confirmación a:
            <br />
            <Typography component="span" fontWeight="bold" color="text.primary" display="block" my={1}>
              {registeredEmail}
            </Typography>
            Por favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
          </DialogContentText>

          {modalMessage && (
            <Alert severity={modalMessage.type} sx={{ mt: 2 }}>
              {modalMessage.text}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            color="inherit"
          >
            {isResending ? "Enviando..." : "Reenviar Email"}
          </Button>
          <Button
            onClick={handleCloseModal}
            variant="contained"
            autoFocus
          >
            Ir al Login
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Register;