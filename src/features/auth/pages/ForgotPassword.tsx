import { ArrowBack, LockReset, MarkEmailRead, Send as SendIcon } from "@mui/icons-material";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  Link,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import React from "react";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField";
import AuthFormContainer from "./components/AuthFormContainer";
import { useForgotPassword } from "../hooks/useForgotPassword";


// --- Subcomponente: Vista de Carga ---
const LoadingView = () => (
  <Fade in={true}>
    <Box textAlign="center" py={5}>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="body1" color="text.secondary" sx={{ mt: 3, fontWeight: 500 }}>
        Procesando solicitud...
      </Typography>
    </Box>
  </Fade>
);

// --- Subcomponente: Vista de Éxito ---
const SuccessView = ({ email, onBack, theme }: any) => (
  <Fade in={true}>
    <Box textAlign="center">
      <Avatar
        sx={{
          width: 72, height: 72, margin: '0 auto', mb: 3,
          bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main
        }}
      >
        <MarkEmailRead fontSize="large" />
      </Avatar>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
        Hemos enviado las instrucciones a <strong>{email}</strong>.<br />
        Por favor revisa tu bandeja de entrada y la carpeta de spam.
      </Typography>

      <Button
        variant="contained"
        onClick={onBack}
        fullWidth size="large"
        sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}
      >
        Volver al Inicio de Sesión
      </Button>
    </Box>
  </Fade>
);

// --- Subcomponente: Vista del Formulario ---
const FormView = ({ formik, status, onBack, theme }: any) => (
  <Fade in={true}>
    <Box>
      <Box textAlign="center" mb={4}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <LockReset fontSize="large" />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Ingresá tu email asociado a la cuenta y te enviaremos un enlace de recuperación.
        </Typography>
      </Box>

      {status.error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {status.error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Stack spacing={3}>
          <FormTextField
            name="email"
            label="Correo Electrónico"
            placeholder="ejemplo@correo.com"
            formik={formik}
            disabled={status.isLoading}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
            endIcon={<SendIcon />}
            disabled={status.isLoading || !formik.isValid || !formik.dirty}
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
          component="button" variant="body2" onClick={onBack}
          underline="hover" color="text.secondary"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
        >
          <ArrowBack fontSize="small" /> Volver al login
        </Link>
      </Box>
    </Box>
  </Fade>
);

// --- Componente Principal ---
const ForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const { formik, status, actions } = useForgotPassword();

  // Determinar Título y Subtítulo dinámicamente
  const getHeaderInfo = () => {
    if (status.successEmail) return { title: "¡Correo Enviado!", subtitle: "" };
    return { title: "Recuperar Contraseña", subtitle: "¿Olvidaste tu clave? No te preocupes, te ayudamos." };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <AuthFormContainer title={title} subtitle={subtitle} maxWidth="sm">
      {/* Lógica de Renderizado Plano (Early Return Pattern) 
         Evita el anidamiento de ternarios ? : ? : 
      */}
      {(() => {
        if (status.isLoading) {
          return <LoadingView />;
        }
        if (status.successEmail) {
          return <SuccessView email={status.successEmail} onBack={actions.handleBackToLogin} theme={theme} />;
        }
        return <FormView formik={formik} status={status} onBack={actions.handleBackToLogin} theme={theme} />;
      })()}
    </AuthFormContainer>
  );
};

export default ForgotPasswordPage;