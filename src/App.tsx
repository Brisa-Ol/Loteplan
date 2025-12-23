import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';

import ClientNavbar from './components/layout/Navbar/ClientNavbar';
import AdminLayout from './components/layout/Navbar/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute/ProtectedRoute';

// --- PÁGINAS PÚBLICAS ---
import Home from './pages/Home/Home';
import Ahorrista from './pages/ComoFunciona/Ahorrista/Ahorrista';
import Inversionista from './pages/ComoFunciona/Inversionista/Inversionista';
import Preguntas from './pages/Preguntas/Preguntas';
import Nosotros from './pages/Nosotros/Nosotros';

// --- PÁGINAS AUTH ---
import Register from './pages/Auth/Register';
import ForgotPasswordPage from './pages/Auth/components/ForgotPassword/ForgotPassword';
import ResetPasswordPage from './pages/Auth/components/ResetPasswordPage';
import ConfirmEmailPage from './pages/Auth/ConfirmEmailPage';
import LoginPage from './pages/Auth/LoginPage';

// --- PÁGINAS CLIENTE (Ahora algunas son públicas) ---
import Perfil from './pages/client/MiCuenta/Perfil';
import MisSuscripciones from './pages/client/MiCuenta/MisSuscripciones';
import ProyectosAhorrista from './pages/client/Proyectos/ProyectosAhorrista';
import ProyectosInversionista from './pages/client/Proyectos/ProyectosInversionista';
import UserDashboard from './pages/client/UserDashboard/UserDashboard';
import SecuritySettings from './pages/client/MiCuenta/SecuritySettings';
import RoleSelection from './pages/client/Proyectos/RoleSelection';
import MensajesPage from './pages/client/MiCuenta/MensajesPage';

import MisSubastas from './pages/client/MiCuenta/MisPujas';
import VerificacionKYC from './pages/client/MiCuenta/VerificacionKYC';
import DetalleProyecto from './pages/client/Proyectos/DetalleProyecto';
import MisInversiones from './pages/client/MiCuenta/MisInversiones';
import MisPagos from './pages/client/MiCuenta/Pagos/MisPagos';
import MisResumenes from './pages/client/MiCuenta/MisResumenes';
import PagoResult from './pages/client/MiCuenta/Pagos/PagoResult';
import MisTransacciones from './pages/client/MiCuenta/Pagos/MisTransacciones';
import MisFavoritos from './pages/client/MiCuenta/MisFavoritos';
import DetalleLote from './pages/client/Lotes/DetalleLote';

// --- PÁGINAS ADMIN ---
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import AdminKYC from './pages/Admin/Usuarios/AdminKYC';
import AdminProyectos from './pages/Admin/Proyectos/AdminProyectos';
import SalaControlPujas from './pages/Admin/Pujas/SalaControlPujas';
import InventarioLotes from './pages/Admin/Lotes/InventarioLotes';
import AdminUsuarios from './pages/Admin/Usuarios/AdminUsuarios';
import AdminSuscripciones from './pages/Admin/Suscripciones/AdminSuscripciones';
import AdminInversiones from './pages/Admin/Inversiones/AdminInversiones';
import AdminCancelaciones from './pages/Admin/Suscripciones/AdminCancelaciones';
import AdminPagos from './pages/Admin/Pagos/AdminPagos';
import LotePagos from './pages/Admin/Lotes/LotePagos';
import AdminPlantillas from './pages/Admin/Contrato/AdminPlantillas';
import AdminTransacciones from './pages/Admin/Transacciones/AdminTransacciones';
import AdminContratosFirmados from './pages/Admin/Contrato/AdminContratosFirmados';
import AdminResumenesCuenta from './pages/Admin/ResumenesCuenta/AdminResumenesCuenta';
import Unauthorized from './pages/Auth/Unauthorized';
import HistorialContratos from './pages/client/Contratos/Historialcontratos';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const AppLoadingScreen: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
    <Box textAlign="center">
      <CircularProgress size={60} thickness={4} />
      <Box mt={2} color="text.secondary" fontWeight={500}>Cargando...</Box>
    </Box>
  </Box>
);

const AppContent: React.FC = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) return <AppLoadingScreen />;

  return (
    <Routes>
      {/* ================================================= */}
      {/* 🟢 ZONA CLIENTE Y PÚBLICA (Navbar Cliente)       */}
      {/* ================================================= */}
      <Route element={<ClientNavbar />}>
        
        {/* --- A. RUTAS TOTALMENTE PÚBLICAS --- */}
        <Route path="/" element={<Home />} />
        <Route path="/como-funciona/ahorrista" element={<Ahorrista />} />
        <Route path="/como-funciona/inversionista" element={<Inversionista />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/preguntas" element={<Preguntas />} />

        <Route path="/proyectos/ahorrista" element={<ProyectosAhorrista />} />
        <Route path="/proyectos/inversionista" element={<ProyectosInversionista />} />
        <Route path="/proyectos/RolSeleccion" element={<RoleSelection />} />
        
      
        <Route path="/proyectos/:id" element={<DetalleProyecto />} />

        {/* --- B. RUTAS DE AUTENTICACIÓN --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/api/auth/confirmar_email/:token" element={<ConfirmEmailPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* --- C. RUTAS PROTEGIDAS (SOLO CLIENTES LOGUEADOS) --- */}
        <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
          <Route path="/client/dashboard" element={<UserDashboard />} />
          <Route path="/client/perfil" element={<Perfil />} />
          <Route path="/client/kyc" element={<VerificacionKYC />} />
          <Route path="/pagos" element={<MisPagos />} />
          <Route path="/client/mensajes" element={<MensajesPage />} />
          <Route path="/client/seguridad" element={<SecuritySettings />} />
          <Route path="/client/suscripciones" element={<MisSuscripciones />} />
          <Route path="/client/Favoritos" element={<MisFavoritos />} />
          <Route path="/client/subastas" element={<MisSubastas />} />
          <Route path="/client/contratos" element={<HistorialContratos />} />
          <Route path="/lotes/:id" element={<DetalleLote />} />
          <Route path="/MisInversiones" element={<MisInversiones />} />
          <Route path="/pago-estado" element={<PagoResult />} />
          <Route path="/client/transacciones" element={<MisTransacciones />} />
          <Route path="/MisResumenes" element={<MisResumenes />} />
        </Route>
      </Route>

      {/* ================================================= */}
      {/* 🔴 ZONA ADMINISTRADOR (AdminLayout)              */}
      {/* ================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/Plantillas" element={<AdminPlantillas />} />
          <Route path="/admin/Firmados" element={<AdminContratosFirmados />} />
          <Route path="/admin/ResumenesCuenta" element={<AdminResumenesCuenta />} />
          <Route path="/admin/transacciones" element={<AdminTransacciones />} />
          <Route path="/admin/KYC" element={<AdminKYC />} />
          <Route path="/admin/Proyectos" element={<AdminProyectos />} />
          <Route path="/admin/suscripciones" element={<AdminSuscripciones />} />
          <Route path="/admin/Inversiones" element={<AdminInversiones />} />
          <Route path="/admin/cancelaciones" element={<AdminCancelaciones/>} />
          <Route path="/Admin/Lotes" element={<InventarioLotes />} />
          <Route path="/admin/Pagos" element={<AdminPagos />} />
          <Route path="/admin/LotePagos" element={<LotePagos />} />
          <Route path="/admin/SalaControlPujas" element={<SalaControlPujas />} />
        </Route>
      </Route>

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