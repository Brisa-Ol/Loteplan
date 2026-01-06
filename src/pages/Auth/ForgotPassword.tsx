// src/pages/Auth/ForgotPassword.tsx

import React, { useState } from "react";
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

import { useAuth } from "../../context/AuthContext";
import { PageContainer } from "../../components/common/PageContainer/PageContainer";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "./components/FormTextField/FormTextField";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { forgotPassword, error, clearError } = useAuth(); // Ya no dependemos solo de isLoading del context
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // ✅ ESTADO LOCAL para respuesta inmediata al click
  const [localLoading, setLocalLoading] = useState(false);

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
      
      // 1. Activamos la carga INMEDIATAMENTE
      setLocalLoading(true);

      try {
        // 2. Esperamos al backend
        await forgotPassword(values.email);
        
        // 3. Si todo sale bien, mostramos éxito
        setSuccessMessage(
          "Hemos enviado las instrucciones de recuperación a tu correo. Por favor, revisa tu bandeja de entrada (y la carpeta de spam)."
        );
      } catch (err) {
        // Si falla, desactivamos la carga para mostrar el error
        // (El error ya se guarda en el context 'error')
      } finally {
        // 4. Desactivamos el loading local
        setLocalLoading(false);
      }
    },
  });

  // Usamos el estado local para decidir qué mostrar
  const showLoading = localLoading;

  // Título dinámico
  const getTitle = () => {
    if (showLoading) return "Enviando...";
    if (successMessage) return "¡Correo Enviado!";
    return "Restablecer Contraseña";
  };

  const getSubtitle = () => {
    if (showLoading) return "Procesando tu solicitud";
    if (successMessage) return "";
    return "Ingresá tu email y te enviaremos un enlace.";
  };

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer
        title={getTitle()}
        subtitle={getSubtitle()}
      >
        
        {/* 1. VISTA DE CARGA (Prioridad absoluta) */}
        {showLoading ? (
           <Fade in={true} timeout={300}>
             <Box textAlign="center" py={5}>
               <CircularProgress size={60} thickness={4} />
               <Typography variant="body1" color="text.secondary" sx={{ mt: 3, fontWeight: 500 }}>
                 Contactando con el servidor...
               </Typography>
             </Box>
           </Fade>
        ) : successMessage ? (
          
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
                {successMessage}
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
                    disabled={showLoading}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    size="large"
                    endIcon={<SendIcon />}
                    disabled={showLoading || !formik.isValid || !formik.dirty}
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