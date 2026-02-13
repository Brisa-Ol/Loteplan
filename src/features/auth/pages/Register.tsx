import { PersonAdd, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import React from "react";
import FormTextField from "../../../shared/components/forms/inputs/FormTextField";
import AuthFormContainer from "./components/AuthFormContainer";
import { useRegister } from "../hooks/useRegister";


// --- Subcomponente: Modal de Éxito ---
const SuccessDialog = ({ open, email, onClose, onResend, resendStatus }: any) => (
  <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}>
    <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem' }}>
      ¡Bienvenido! 🎉
    </DialogTitle>
    <DialogContent>
      <DialogContentText textAlign="center" sx={{ fontSize: '1rem', mb: 2 }}>
        Hemos enviado un enlace de confirmación a <strong>{email}</strong>.
        <br />Por favor activa tu cuenta para ingresar.
      </DialogContentText>
      {resendStatus.msg && (
        <Alert severity={resendStatus.msg.includes("Error") ? "error" : "info"} sx={{ mt: 2, borderRadius: 2 }}>
          {resendStatus.msg}
        </Alert>
      )}
    </DialogContent>
    <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, flexDirection: 'column', gap: 1 }}>
      <Button onClick={onClose} variant="contained" fullWidth size="large" sx={{ fontWeight: 700, borderRadius: 2 }}>
        Ir al Login
      </Button>
      <Button 
        onClick={onResend} 
        disabled={resendStatus.loading} 
        size="small" 
        sx={{ textTransform: 'none' }}
      >
        {resendStatus.loading ? "Enviando..." : "No recibí el email, reenviar"}
      </Button>
    </DialogActions>
  </Dialog>
);

// --- Componente Principal ---
const Register: React.FC = () => {
  const theme = useTheme();
  const { formik, status, actions } = useRegister();

  if (status.isInitializing) {
    return (
      <Box display="flex" height="100vh" justifyContent="center" alignItems="center" bgcolor="background.default">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      <AuthFormContainer
        title="Crea tu Cuenta"
        subtitle="Únete a nuestra comunidad de inversores hoy mismo."
        maxWidth="sm"
      >
        <Box textAlign="center" mb={4}>
          <Box sx={{ 
            width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <PersonAdd fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Regístrate</Typography>
        </Box>

        {status.error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {status.error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            {/* Fila 1: Nombre y Apellido */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormTextField name="nombre" label="Nombre" formik={formik} disabled={status.isLoading} />
              <FormTextField name="apellido" label="Apellido" formik={formik} disabled={status.isLoading} />
            </Box>

            {/* Fila 2: Email */}
            <FormTextField name="email" label="Email" type="email" formik={formik} disabled={status.isLoading} />

            {/* Fila 3: DNI y Teléfono */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormTextField name="dni" label="DNI" formik={formik} disabled={status.isLoading} />
              <FormTextField name="numero_telefono" label="Teléfono" formik={formik} disabled={status.isLoading} />
            </Box>

            {/* Fila 4: Usuario */}
            <FormTextField name="nombre_usuario" label="Usuario" formik={formik} disabled={status.isLoading} />

            {/* Fila 5: Password */}
            <FormTextField
              name="contraseña"
              label="Contraseña"
              type={status.showPassword ? "text" : "password"}
              formik={formik}
              disabled={status.isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={actions.togglePassword} edge="end">
                      {status.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Fila 6: Confirmar Password */}
            <FormTextField name="confirmPassword" label="Confirmar Contraseña" type="password" formik={formik} disabled={status.isLoading} />

            <Button 
              fullWidth variant="contained" type="submit" size="large" 
              disabled={status.isLoading} 
              sx={{ py: 1.5, fontWeight: 700, mt: 2, borderRadius: 2 }}
            >
              {status.isLoading ? <CircularProgress size={24} color="inherit" /> : "REGISTRARSE"}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes cuenta?{' '}
            <Link 
              component="button" variant="body2" fontWeight={700} color="primary" underline="hover"
              onClick={actions.navigateToLogin} 
            >
              Inicia sesión aquí
            </Link>
          </Typography>
        </Box>
      </AuthFormContainer>

      <SuccessDialog 
        open={status.modalOpen} 
        email={status.registeredEmail}
        onClose={actions.closeModal}
        onResend={actions.handleResend}
        resendStatus={status.resendStatus}
      />
    </>
  );
};

export default Register;