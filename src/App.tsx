import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import ClientNavbar from './components/layout/Navbar/ClientNavbar';
import AdminLayout from './components/layout/Navbar/AdminLayout';

// Componente de Seguridad
import ProtectedRoute from './routes/ProtectedRoute/ProtectedRoute';

// --- PÁGINAS PÚBLICAS ---
import Home from './pages/Home/Home';
import Ahorrista from './pages/ComoFunciona/Ahorrista/Ahorrista';
import Inversionista from './pages/ComoFunciona/Inversionista/Inversionista';
import Preguntas from './pages/Preguntas/Preguntas';
import Nosotros from './pages/Nosotros/Nosotros';
import Unauthorized from './pages/Unauthorized';

// --- PÁGINAS AUTH ---
import Register from './pages/Auth/Register';
import ForgotPasswordPage from './pages/Auth/components/ForgotPassword/ForgotPassword';
import ResetPasswordPage from './pages/Auth/components/ResetPasswordPage';
import ConfirmEmailPage from './pages/Auth/ConfirmEmailPage';
import LoginPage from './pages/Auth/LoginPage';

// --- PÁGINAS CLIENTE ---
import Perfil from './pages/client/MiCuenta/Perfil';
import MisPagos from './pages/client/MiCuenta/MisPagos';
import MisSuscripciones from './pages/client/MiCuenta/MisSuscripciones';
import ProyectosAhorrista from './pages/client/Proyectos/ProyectosAhorrista';
import ProyectosInversionista from './pages/client/Proyectos/ProyectosInversionista';


// --- PÁGINAS ADMIN ---
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import UserDashboard from './pages/client/UserDashboard/UserDashboard';
import AdminLotes from './pages/Admin/Lotes/AdminLotes';
import AdminSubastas from './pages/Admin/Lotes/AdminSubastas';
import SecuritySettings from './pages/client/MiCuenta/SecuritySettings';
import AdminDashboardImpagos from './pages/Admin/Lotes/AdminDashboardImpagos';
import AdminUsuarios from './pages/Admin/Usuarios/AdminUsuarios';
import RoleSelection from './pages/client/Proyectos/RoleSelection';
import MensajesPage from './pages/client/MiCuenta/MensajesPage';
import Contratos from './pages/client/MiCuenta/Contratos';
import MisSubastas from './pages/client/MiCuenta/MisSubastas';
import AdminKYC from './pages/Admin/Usuarios/AdminKYC';
import AdminProyectos from './pages/Admin/Proyectos/AdminProyectos';
import VerificacionKYC from './pages/client/MiCuenta/VerificacionKYC';
import DetalleProyecto from './pages/client/Proyectos/DetalleProyecto';



const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// COMPONENTE DE PANTALLA DE CARGA
const AppLoadingScreen: React.FC = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}
  >
    <Box textAlign="center">
      <CircularProgress size={60} thickness={4} />
      <Box mt={2} color="text.secondary">Cargando...</Box>
    </Box>
  </Box>
);

// WRAPPER QUE CONTROLA LA CARGA INICIAL
const AppContent: React.FC = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return <AppLoadingScreen />;
  }

  return (
    <Routes>
      {/* ================================================= */}
      {/* 🟢 RUTAS PÚBLICAS Y CLIENTE (Usan ClientNavbar)  */}
      {/* ================================================= */}
      <Route element={<ClientNavbar />}>
        {/* A. Páginas Públicas (Home y Landing) */}
        {/* CORREGIDO: Rutas estándar en minúsculas */}
        <Route path="/" element={<Home />} />
        <Route path="/como-funciona/ahorrista" element={<Ahorrista />} />
        <Route path="/como-funciona/inversionista" element={<Inversionista />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/preguntas" element={<Preguntas />} />
        
        {/* B. Auth (Rutas estándar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* C. Exploración Pública (Lotes y Proyectos) - Pueden ser públicas o protegidas según prefieras */}
        {/* Estas rutas las usan tanto usuarios logueados como visitantes para ver la "vidriera" */}
        <Route path="/proyectos/ahorrista" element={<ProyectosAhorrista />} />
        <Route path="/proyectos/inversionista" element={<ProyectosInversionista />} />
        <Route path="/proyectos/:id" element={<DetalleProyecto />} /> {/* 👈 Faltaba esta ruta vital */}
        


        {/* D. Rutas Protegidas de CLIENTE (Mi Cuenta, etc.) */}
        <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
          <Route path="/client/dashboard" element={<UserDashboard />} />
          <Route path="/client/perfil" element={<Perfil />} />
          <Route path="/client/kyc" element={<VerificacionKYC />} />
          <Route path="/client/pagos" element={<MisPagos />} />
          <Route path="/client/mensajes" element={<MensajesPage />} />
          <Route path="/client/seguridad" element={<SecuritySettings/>} />
          <Route path="/client/suscripciones" element={<MisSuscripciones />} />
          <Route path="/client/subastas" element={<MisSubastas />} />
          <Route path="/client/contratos" element={<Contratos />} />
          
          <Route path="/client/proyectos/seleccion" element={<RoleSelection />} />
        </Route>
      </Route>

      {/* ================================================= */}
      {/* 🔴 RUTAS ADMIN (Usan AdminLayout)                */}
      {/* ================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/kyc" element={<AdminKYC />} />
          <Route path="/admin/proyectos" element={<AdminProyectos />} />
          <Route path="/admin/lotes" element={<AdminLotes />} />
          <Route path="/admin/impagos" element={<AdminDashboardImpagos />} />
          <Route path="/admin/subastas" element={<AdminSubastas />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;