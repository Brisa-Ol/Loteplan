import { CheckCircleOutline, LockReset, Visibility, VisibilityOff, VpnKey } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React from 'react';
import FormTextField from '../../../shared/components/forms/inputs/FormTextField';
import { useResetPassword } from '../hooks/useResetPassword';
import AuthFormContainer from './components/AuthFormContainer';


// --- Subcomponente: Vista de Éxito ---
const SuccessView = ({ onNavigate, theme }: any) => (
  <Fade in={true}>
    <Box textAlign="center">
      <Avatar sx={{ 
        width: 72, height: 72, margin: '0 auto', mb: 3, 
        bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main 
      }}>
        <CheckCircleOutline fontSize="large" />
      </Avatar>
      <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
        Contraseña Actualizada
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Serás redirigido al inicio de sesión en unos segundos...
      </Typography>
      <Button 
        variant="contained" 
        onClick={onNavigate} 
        fullWidth size="large" 
        sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}
      >
        Ir al Login ahora
      </Button>
    </Box>
  </Fade>
);

// --- Componente Principal ---
const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const { formik, status, actions } = useResetPassword();

  // Si fue exitoso, mostramos la vista de éxito directamente
  if (status.isSuccess) {
    return (
      <AuthFormContainer title="¡Todo listo!" subtitle="Tu clave ha sido actualizada correctamente." maxWidth="sm">
        <SuccessView onNavigate={actions.navigateToLogin} theme={theme} />
      </AuthFormContainer>
    );
  }

  return (
    <AuthFormContainer
      title="Nueva Contraseña"
      subtitle="Crea una contraseña segura para proteger tu cuenta."
      maxWidth="sm"
    >
      <Fade in={true}>
        <Box>
          {/* Header Icon */}
          <Box textAlign="center" mb={4}>
            <Box sx={{ 
              width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <VpnKey fontSize="large" />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Ingresa tu nueva contraseña a continuación.
            </Typography>
          </Box>

          {/* Alerta de Error */}
          {status.isError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {status.errorMessage}
            </Alert>
          )}

          {/* Formulario */}
          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>
              <FormTextField
                name="password"
                label="Nueva Contraseña"
                type={status.showPassword ? "text" : "password"}
                disabled={status.isLoading}
                formik={formik}
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
              
              <FormTextField
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                type={status.showConfirmPassword ? "text" : "password"}
                disabled={status.isLoading}
                formik={formik}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={actions.toggleConfirmPassword} edge="end">
                        {status.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                disabled={status.isLoading} 
                endIcon={!status.isLoading && <LockReset />} 
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
              >
                {status.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Cambiar Contraseña'}
              </Button>
            </Stack>
          </form>
        </Box>
      </Fade>
    </AuthFormContainer>
  );
};

export default ResetPasswordPage;