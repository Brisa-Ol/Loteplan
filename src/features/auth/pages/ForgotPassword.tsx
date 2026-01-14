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
  Link,
  useTheme,
  alpha
} from "@mui/material";
import { MarkEmailRead, ArrowBack, Send as SendIcon, LockReset } from "@mui/icons-material";

// Contexto y Componentes
import { useAuth } from "../../context/AuthContext";
import AuthFormContainer from "./components/AuthFormContainer/AuthFormContainer";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField/FormTextField";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Hooks de Autenticación
  const { 
    forgotPassword, 
    isLoading, 
    error, 
    clearError 
  } = useAuth();
  
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  // Limpieza de errores
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
        await forgotPassword(values.email);
        setSuccessEmail(values.email);
      } catch (err) {
        // Error manejado por el contexto
      }
    },
  });

  return (
    <AuthFormContainer
      title={successEmail ? "¡Correo Enviado!" : "Recuperar Contraseña"}
      subtitle={successEmail 
        ? "" 
        : "¿Olvidaste tu clave? No te preocupes, te ayudamos a restablecerla."}
      maxWidth="sm"
    >
      {/* 1. VISTA DE CARGA */}
      {isLoading ? (
         <Fade in={true}>
           <Box textAlign="center" py={5}>
             <CircularProgress size={60} thickness={4} />
             <Typography variant="body1" color="text.secondary" sx={{ mt: 3, fontWeight: 500 }}>
               Procesando solicitud...
             </Typography>
           </Box>
         </Fade>
      ) : successEmail ? (
        
        /* 2. VISTA DE ÉXITO */
        <Fade in={true}>
          <Box textAlign="center">
            <Avatar 
              sx={{ 
                width: 72, height: 72, margin: '0 auto', mb: 3,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main
              }}
            >
              <MarkEmailRead fontSize="large" />
            </Avatar>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Hemos enviado las instrucciones a <strong>{successEmail}</strong>.<br/>
              Por favor revisa tu bandeja de entrada y la carpeta de spam.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              fullWidth
              size="large"
              sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}
            >
              Volver al Inicio de Sesión
            </Button>
          </Box>
        </Fade>

      ) : (
        
        /* 3. VISTA DE FORMULARIO */
        <Fade in={true}>
          <Box>
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
                <LockReset fontSize="large" />
              </Box>
              <Typography variant="body1" color="text.secondary">
                Ingresá tu email asociado a la cuenta y te enviaremos un enlace de recuperación.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <FormTextField
                  name="email"
                  label="Correo Electrónico"
                  placeholder="ejemplo@correo.com"
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
                  sx={{ 
                    py: 1.5, fontWeight: 700, borderRadius: 2, boxShadow: 'none',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                  }}
                >
                  Enviar Enlace
                </Button>
              </Stack>
            </form>

            <Box textAlign="center" mt={4}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/login")}
                underline="hover"
                color="text.secondary"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
              >
                <ArrowBack fontSize="small" /> Volver al login
              </Link>
            </Box>
          </Box>
        </Fade>
      )}
    </AuthFormContainer>
  );
};

export default ForgotPasswordPage;