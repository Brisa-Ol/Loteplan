// src/pages/Auth/Register.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
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

// Contexto y Componentes
import { useAuth } from "../../context/AuthContext";
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "./components/FormTextField/FormTextField";
import type { RegisterRequestDto } from "../../types/dto/auth.dto";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    isLoading,
    isInitializing,
    error,
    clearError,
    resendConfirmation
  } = useAuth();

  // Estados Locales
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);

  // Esquema de Validación
  const validationSchema = Yup.object({
    nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
    email: Yup.string().email("Formato inválido").required("Requerido"),
    dni: Yup.string()
      .matches(/^\d+$/, "Solo números")
      .min(7, "Mínimo 7 dígitos")
      .max(8, "Máximo 8 dígitos")
      .required("Requerido"),
    nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("Requerido"),
    numero_telefono: Yup.string()
      .matches(/^\d+$/, "Solo números")
      .min(10, "Mínimo 10 dígitos")
      .required("Requerido"),
    contraseña: Yup.string()
      .min(8, "Mínimo 8 caracteres")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Requiere mayúscula, minúscula y número")
      .required("Requerida"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("contraseña")], "Las contraseñas no coinciden")
      .required("Confirma tu contraseña"),
  });

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
    validationSchema,
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
        
        // Si register no lanza error, mostramos modal de éxito
        setRegisteredEmail(values.email);
        setModalOpen(true);
      } catch (err) {
        // El error es manejado por el AuthContext
      }
    },
  });

  const handleResend = async () => {
    setResending(true);
    try {
      await resendConfirmation(registeredEmail);
      alert("Email reenviado correctamente.");
    } catch {
      alert("Error al reenviar.");
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    navigate("/login");
  };

  if (isInitializing) {
    return (
      <Box display="flex" height="100vh" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer title="Crear Cuenta" subtitle="Únete a nuestra comunidad de inversores">
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            <Box display="flex" gap={2}>
              <FormTextField fullWidth name="nombre" label="Nombre" formik={formik} disabled={isLoading} />
              <FormTextField fullWidth name="apellido" label="Apellido" formik={formik} disabled={isLoading} />
            </Box>

            <FormTextField fullWidth name="email" label="Email" type="email" formik={formik} disabled={isLoading} />

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="DNI"
                disabled={isLoading}
                {...formik.getFieldProps("dni")}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                    formik.setFieldValue("dni", val);
                }}
                error={formik.touched.dni && Boolean(formik.errors.dni)}
                helperText={formik.touched.dni && formik.errors.dni}
              />
              <TextField
                fullWidth
                label="Teléfono"
                disabled={isLoading}
                {...formik.getFieldProps("numero_telefono")}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                    formik.setFieldValue("numero_telefono", val);
                }}
                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
              />
            </Box>

            <FormTextField fullWidth name="nombre_usuario" label="Usuario" formik={formik} disabled={isLoading} />

            <FormTextField
              fullWidth
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
              fullWidth
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
              sx={{ py: 1.5, fontWeight: 700, mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "REGISTRARSE"}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2">
            ¿Ya tienes cuenta?{' '}
            <Button
              onClick={() => navigate("/login")}
              color="primary"
              sx={{ fontWeight: 700, textTransform: 'none', minWidth: 'auto', p: 0 }}
            >
              Inicia sesión aquí
            </Button>
          </Typography>
        </Box>

        {/* Modal Éxito */}
        <Dialog open={modalOpen} onClose={handleClose}>
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>¡Bienvenido!</DialogTitle>
          <DialogContent>
            <DialogContentText textAlign="center">
              Hemos enviado un enlace de confirmación a <strong>{registeredEmail}</strong>.
              <br />Por favor activa tu cuenta para ingresar.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
            <Button onClick={handleResend} disabled={resending}>
                {resending ? "Enviando..." : "Reenviar Email"}
            </Button>
            <Button onClick={handleClose} variant="contained" autoFocus>
                Ir al Login
            </Button>
          </DialogActions>
        </Dialog>

      </AuthFormContainer>
    </PageContainer>
  );
};

export default Register;