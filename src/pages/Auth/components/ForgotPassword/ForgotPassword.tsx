// src/pages/Auth/ForgotPassword.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Link as MuiLink,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import AuthFormContainer from "../AuthFormContainer/AuthFormContainer";
import { PageContainer } from "../../../../components/common/PageContainer/PageContainer";
import { useAuth } from "../../../../context/AuthContext";


const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Email inválido").required("Ingresá tu email"),
    }),
    onSubmit: async (values) => {
      clearError();
      setSuccessMessage(null);
      try {
        await forgotPassword(values.email);
        setSuccessMessage(
          "Si existe una cuenta con ese email, recibirás un correo con instrucciones."
        );
      } catch (err) {
        console.error("Error al solicitar reseteo:", err);
      }
    },
  });

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer
        title="Restablecer Contraseña"
        subtitle="Ingresá tu email y te enviaremos un enlace."
      >
        {successMessage ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        ) : null}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={0}>
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              {...formik.getFieldProps("email")}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={isLoading || !!successMessage}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={isLoading || !!successMessage}
              sx={{ mt: 3, py: 1.2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Enviar Enlace"
              )}
            </Button>
          </Stack>
        </form>

        <Stack spacing={1} sx={{ mt: 3 }} alignItems="center">
          <MuiLink
            component="button"
            variant="body2"
            onClick={() => navigate("/login")}
            sx={{ cursor: "pointer" }}
          >
            Volver a Iniciar Sesión
          </MuiLink>
        </Stack>
      </AuthFormContainer>
    </PageContainer>
  );
};

export default ForgotPasswordPage;