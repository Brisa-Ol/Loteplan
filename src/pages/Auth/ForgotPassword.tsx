// src/pages/Auth/ForgotPassword.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Button,
  Alert,
  CircularProgress,
  Stack,
  Box,
  Typography,
  Fade,
  Avatar,
  alpha,
  useTheme
} from "@mui/material";
import { MarkEmailRead, ArrowBack, Send as SendIcon } from "@mui/icons-material";

// Contexto y Componentes
import { useAuth } from "../../context/AuthContext";
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "./components/FormTextField/FormTextField";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // ✅ Extraemos todo del hook unificado
  const { 
    forgotPassword, 
    isLoading, // Viene de useAccountActions
    error,     // Viene de useAccountActions
    clearError 
  } = useAuth();
  
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  // Limpiar errores al entrar/salir
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Email inválido").required("Ingresá tu email"),
    }),
    onSubmit: async (values) => {
      clearError();
      try {
        // useAccountActions maneja la carga y el error internamente
        await forgotPassword(values.email);
        
        // Si no hay error (la promesa se resuelve), mostramos éxito
        setSuccessEmail(values.email);
      } catch (err) {
        // No es necesario hacer nada, el error se mostrará en la UI gracias al context
      }
    },
  });

  // Título dinámico según estado
  const getTitle = () => {
    if (isLoading) return "Enviando...";
    if (successEmail) return "¡Correo Enviado!";
    return "Recuperar Contraseña";
  };

  const getSubtitle = () => {
    if (isLoading) return "Procesando tu solicitud";
    if (successEmail) return "";
    return "Ingresá tu email y te enviaremos las instrucciones.";
  };

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer
        title={getTitle()}
        subtitle={getSubtitle()}
      >
        
        {/* 1. VISTA DE CARGA (Usando isLoading del hook) */}
        {isLoading ? (
           <Fade in={true} timeout={300}>
             <Box textAlign="center" py={5}>
               <CircularProgress size={60} thickness={4} />
               <Typography variant="body1" color="text.secondary" sx={{ mt: 3, fontWeight: 500 }}>
                 Contactando con el servidor...
               </Typography>
             </Box>
           </Fade>
        ) : successEmail ? (
          
          /* 2. VISTA DE ÉXITO */
          <Fade in={true}>
            <Box textAlign="center" py={3}>
              <Avatar 
                sx={{ 
                  width: 64, height: 64, margin: '0 auto', mb: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main
                }}
              >
                <MarkEmailRead fontSize="large" />
              </Avatar>
              
              <Typography variant="h6" gutterBottom color="text.primary">
                Revisa tu bandeja de entrada
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 4 }}>
                Hemos enviado las instrucciones a <strong>{successEmail}</strong>.<br/>
                Por favor revisa también tu carpeta de spam.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                fullWidth
                size="large"
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Volver al Inicio de Sesión
              </Button>
            </Box>
          </Fade>

        ) : (
          
          /* 3. VISTA DE FORMULARIO */
          <Fade in={true}>
            <Box>
              {/* ✅ Error Inline del Contexto */}
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={clearError}>
                  {error}
                </Alert>
              )}

              <form onSubmit={formik.handleSubmit}>
                <Stack spacing={3}>
                  <FormTextField
                    fullWidth
                    name="email"
                    label="Email"
                    formik={formik}
                    disabled={isLoading}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    size="large"
                    endIcon={<SendIcon />}
                    disabled={isLoading || !formik.isValid || !formik.dirty}
                    sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
                  >
                    Enviar Enlace
                  </Button>
                </Stack>
              </form>

              <Box textAlign="center" mt={3}>
                <Button
                  onClick={() => navigate("/login")}
                  color="inherit"
                  startIcon={<ArrowBack />}
                  sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                  Volver
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
        
      </AuthFormContainer>
    </PageContainer>
  );
};

export default ForgotPasswordPage;