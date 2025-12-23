// src/pages/Auth/ForgotPassword.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Alert,
  CircularProgress,
  Stack,
  Box,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../../../context/AuthContext";
import { PageContainer } from "../../../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "../AuthFormContainer/AuthFormContainer";
import FormTextField from "../FormTextField/FormTextField";


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

  const isDisabled = isLoading || !!successMessage;

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
          {/* Usamos spacing={3} para consistencia con Login/Register */}
          <Stack spacing={3}>
            
            {/* Componente optimizado */}
            <FormTextField
              fullWidth
              name="email"
              label="Email"
              formik={formik}
              disabled={isDisabled}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large" // Toma el padding del theme
              disabled={isDisabled}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Enviar Enlace"
              )}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={3}>
          <Button
            onClick={() => navigate("/login")}
            color="primary" // O "inherit" si prefieres gris
            disabled={isLoading}
            sx={{ fontWeight: 500 }}
          >
            Volver a Iniciar Sesión
          </Button>
        </Box>
        
      </AuthFormContainer>
    </PageContainer>
  );
};

export default ForgotPasswordPage;