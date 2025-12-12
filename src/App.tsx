// src/App.tsx

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

// --- PÁGINAS CLIENTE ---
import Perfil from './pages/client/MiCuenta/Perfil';

import MisSuscripciones from './pages/client/MiCuenta/MisSuscripciones';
import ProyectosAhorrista from './pages/client/Proyectos/ProyectosAhorrista';
import ProyectosInversionista from './pages/client/Proyectos/ProyectosInversionista';
import UserDashboard from './pages/client/UserDashboard/UserDashboard';
import SecuritySettings from './pages/client/MiCuenta/SecuritySettings';
import RoleSelection from './pages/client/Proyectos/RoleSelection';
import MensajesPage from './pages/client/MiCuenta/MensajesPage';
import Contratos from './pages/client/Contratos/Historialcontratos';
import MisSubastas from './pages/client/MiCuenta/MisSubastas';
import VerificacionKYC from './pages/client/MiCuenta/VerificacionKYC';
import DetalleProyecto from './pages/client/Proyectos/DetalleProyecto';

// --- PÁGINAS ADMIN ---
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';

import AdminKYC from './pages/Admin/Usuarios/AdminKYC';
import AdminProyectos from './pages/Admin/Proyectos/AdminProyectos';
import SalaControlPujas from './pages/Admin/Pujas/SalaControlPujas';
import InventarioLotes from './pages/Admin/Lotes/InventarioLotes';
import AdminUsuarios from './pages/Admin/Usuarios/AdminUsuarios';
import MisFavoritos from './pages/client/MiCuenta/MisFavoritos';
import DetalleLote from './pages/client/Lotes/DetalleLote';
import AdminSuscripciones from './pages/Admin/Suscripciones/AdminSuscripciones';
import AdminInversiones from './pages/Admin/Inversiones/AdminInversiones';
import AdminCancelaciones from './pages/Admin/Suscripciones/AdminCancelaciones';
import AdminPagos from './pages/Admin/Pagos/AdminPagos';
import LotePagos from './pages/Admin/Lotes/LotePagos';
import AdminPlantillas from './pages/Admin/Contrato/AdminPlantillas';

import AdminTransacciones from './pages/Admin/Transacciones/AdminTransacciones';
import Unauthorized from './pages/Auth/Unauthorized';
import AdminContratosFirmados from './pages/Admin/Contrato/AdminContratosFirmados';
import AdminResumenesCuenta from './pages/Admin/ResumenesCuenta/AdminResumenesCuenta';
import MisInversiones from './pages/client/MiCuenta/MisInversiones';
import MisPagos from './pages/client/MiCuenta/Pagos/MisPagos';
import MisResumenes from './pages/client/MiCuenta/MisResumenes';
import PagoResult from './pages/client/MiCuenta/Pagos/PagoResult';
import MisTransacciones from './pages/client/MiCuenta/Pagos/MisTransacciones';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// ✅ PANTALLA DE CARGA MEJORADA
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
      <Box mt={2} color="text.secondary" fontWeight={500}>
        Cargando...
      </Box>
    </Box>
  </Box>
);

// ✅ WRAPPER MEJORADO - Evita el parpadeo del navbar
const AppContent: React.FC = () => {
  const { isInitializing, user } = useAuth();

  // ⚠️ CRÍTICO: Mientras carga, NO renderizar NINGÚN navbar
  if (isInitializing) {
    return <AppLoadingScreen />;
  }

  return (
    <Routes>
      {/* ================================================= */}
      {/* 🟢 RUTAS PÚBLICAS Y CLIENTE (Usan ClientNavbar)  */}
      {/* ================================================= */}
      <Route element={<ClientNavbar />}>
        {/* A. Páginas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/como-funciona/ahorrista" element={<Ahorrista />} />
        <Route path="/como-funciona/inversionista" element={<Inversionista />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/preguntas" element={<Preguntas />} />

        <Route path="/proyectos/ahorrista" element={<ProyectosAhorrista />} />
        <Route path="/proyectos/inversionista" element={<ProyectosInversionista />} />
        <Route path="/client/proyectos/seleccion" element={<RoleSelection />} />

        {/* B. Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* D. Rutas Protegidas de CLIENTE */}
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
          <Route path="/client/contratos" element={<Contratos />} />
          
          <Route path="/proyectos/:id" element={<DetalleProyecto />} />
          <Route path="/lotes/:id" element={<DetalleLote />} />
          <Route path="/pages/client/MiCuenta/MisSubastas" element={<MisSubastas />} />
           <Route path="/SecuritySettings" element={<SecuritySettings />} />
           <Route path="/MisInversiones" element={<MisInversiones />} />
         {/* ✅ PANTALLA DE RESULTADO DE PAGO (Donde redirige MercadoPago) */}
          <Route path="/pago-estado" element={<PagoResult />} />


          {/* ✅ HISTORIAL DE TRANSACCIONES (Reintentos y Auditoría) */}
          <Route path="/client/transacciones" element={<MisTransacciones />} />
<Route path="/MisResumenes" element={<MisResumenes />} />
          
        </Route>
      </Route>

      {/* ================================================= */}
      {/* 🔴 RUTAS ADMIN (Usan AdminLayout)                */}
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
