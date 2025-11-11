import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  AlertTitle,
  Stack,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../context/AuthContext";
import type { RegisterData } from "../../types/dto/auth.types";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading, error, clearError, resendConfirmation } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const successMessage = location.state?.message;

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate, location.pathname]);

  // ✅ Configuración Formik + Yup
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
      nombre: Yup.string()
        .trim()
        .min(2, "Mínimo 2 caracteres")
        .required("El nombre es requerido"),
      apellido: Yup.string()
        .trim()
        .min(2, "Mínimo 2 caracteres")
        .required("El apellido es requerido"),
      email: Yup.string()
        .trim()
        .email("Email inválido")
        .required("El email es requerido"),
      dni: Yup.string()
        .matches(/^\d+$/, "Solo números")
        .min(7, "DNI inválido")
        .max(8, "DNI inválido")
        .required("El DNI es requerido"),
      nombre_usuario: Yup.string()
        .trim()
        .min(4, "Mínimo 4 caracteres")
        .matches(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo")
        .required("El nombre de usuario es requerido"),
      numero_telefono: Yup.string()
        .matches(/^\d+$/, "Solo números")
        .min(10, "Teléfono inválido")
        .max(10, "Teléfono inválido")
        .required("El teléfono es requerido"),
      contraseña: Yup.string()
        .min(8, "Mínimo 8 caracteres")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe contener mayúsculas, minúsculas y números")
        .required("La contraseña es requerida"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("contraseña")], "Las contraseñas no coinciden")
        .required("Confirma tu contraseña"),
    }),
    onSubmit: async (values) => {
      clearError();
      try {
        const data: RegisterData = {
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
        console.error("Error en el registro:", err);
      }
    },
  });

  const renderPasswordAdornment = (show: boolean, toggle: () => void) => (
    <InputAdornment position="end">
      <IconButton onClick={toggle} edge="end" disabled={isLoading}>
        {show ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  const handleResendEmail = async () => {
    setModalMessage(null);
    setIsModalLoading(true);
    try {
      await resendConfirmation(registeredEmail);
      setModalMessage({ type: "success", text: "¡Email de confirmación reenviado!" });
    } catch {
      setModalMessage({ type: "error", text: "Error al reenviar el email. Inténtalo de nuevo." });
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleModifyEmail = () => setIsModalOpen(false);
  const handleGoToLogin = () => {
    setIsModalOpen(false);
    navigate("/login");
  };

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer
        title="Crear cuenta"
        subtitle="Comenzá tu camino como ahorrista o inversionista"
        maxWidth={500}
      >
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Nombre"
              {...formik.getFieldProps("nombre")}
              error={formik.touched.nombre && Boolean(formik.errors.nombre)}
              helperText={formik.touched.nombre && formik.errors.nombre}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="Apellido"
              {...formik.getFieldProps("apellido")}
              error={formik.touched.apellido && Boolean(formik.errors.apellido)}
              helperText={formik.touched.apellido && formik.errors.apellido}
              disabled={isLoading}
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            margin="normal"
            {...formik.getFieldProps("email")}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            disabled={isLoading}
          />

          {/* ✅ Solo números en tiempo real */}
          <TextField
            fullWidth
            label="DNI"
            margin="normal"
            {...formik.getFieldProps("dni")}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 8);
              formik.setFieldValue("dni", value);
            }}
            error={formik.touched.dni && Boolean(formik.errors.dni)}
            helperText={formik.touched.dni && formik.errors.dni}
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Nombre de Usuario"
            margin="normal"
            {...formik.getFieldProps("nombre_usuario")}
            error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
            helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Número de Teléfono"
            margin="normal"
            {...formik.getFieldProps("numero_telefono")}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              formik.setFieldValue("numero_telefono", value);
            }}
            error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
            helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Contraseña"
            margin="normal"
            type={showPassword ? "text" : "password"}
            {...formik.getFieldProps("contraseña")}
            error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
            helperText={formik.touched.contraseña && formik.errors.contraseña}
            disabled={isLoading}
            InputProps={{
              endAdornment: renderPasswordAdornment(showPassword, () => setShowPassword(!showPassword)),
            }}
          />

          <TextField
            fullWidth
            label="Confirmar contraseña"
            margin="normal"
            type={showConfirmPassword ? "text" : "password"}
            {...formik.getFieldProps("confirmPassword")}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            disabled={isLoading}
            InputProps={{
              endAdornment: renderPasswordAdornment(showConfirmPassword, () =>
                setShowConfirmPassword(!showConfirmPassword)
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={isLoading}
            sx={{ mt: 3, py: 1.2 }}
          >
            {isLoading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Registrarse"}
          </Button>

          <Box textAlign="center" mt={2}>
            <Button
              onClick={() => navigate("/login")}
              sx={{ textTransform: "none", color: "primary.main", fontWeight: 500 }}
              disabled={isLoading}
            >
              ¿Ya tenés cuenta? Iniciá sesión
            </Button>
          </Box>
        </form>
      </AuthFormContainer>

      {/* ✅ Modal de confirmación */}
      <Dialog open={isModalOpen} onClose={handleGoToLogin}>
        <DialogTitle>¡Registro Exitoso!</DialogTitle>
        <DialogContent>
          <DialogContentText>Enviamos un email de confirmación a:</DialogContentText>
          <Box component="span" sx={{ display: "block", fontWeight: 600, my: 1, fontSize: "1.1rem" }}>
            {registeredEmail}
          </Box>
          <DialogContentText>Revisá tu bandeja (y spam) para activar tu cuenta.</DialogContentText>

          {modalMessage && (
            <Alert severity={modalMessage.type} sx={{ mt: 2 }}>
              {modalMessage.text}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>¿Email incorrecto o no te llegó?</AlertTitle>
            Podés modificar tu email o reenviar el correo.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: "space-between" }}>
          <Stack spacing={1} direction="row">
            <Button onClick={handleModifyEmail} disabled={isModalLoading}>Modificar Email</Button>
            <Button onClick={handleResendEmail} disabled={isModalLoading}>
              {isModalLoading ? <CircularProgress size={24} /> : "Reenviar Email"}
            </Button>
          </Stack>
          <Button onClick={handleGoToLogin} variant="contained" autoFocus>Ir a Login</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Register;
