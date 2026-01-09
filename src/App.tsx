// src/App.tsx

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';

// ✅ Imports para el Manejo Global de Errores
import { SnackbarProvider, useSnackbar } from './context/SnackbarContext'; 
import { setGlobalSnackbar } from './utils/snackbarUtils'; 

import ClientNavbar from './components/layout/Navbar/ClientNavbar';
import AdminLayout from './components/layout/Navbar/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute/ProtectedRoute';

// --- PÁGINAS PÚBLICAS (Eager Loading) ---
import Home from './pages/Home/Home';
import Ahorrista from './pages/ComoFunciona/Ahorrista/Ahorrista';
import Inversionista from './pages/ComoFunciona/Inversionista/Inversionista';
import Preguntas from './pages/Preguntas/Preguntas';
import Nosotros from './pages/Nosotros/Nosotros';

// --- PÁGINAS AUTH (Eager Loading) ---
import Register from './pages/Auth/Register';

import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import ConfirmEmailPage from './pages/Auth/ConfirmEmailPage';
import LoginPage from './pages/Auth/LoginPage';
import Unauthorized from './pages/Auth/Unauthorized';

// --- PÁGINAS CLIENTE (Eager Loading) ---
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
import HistorialContratos from './pages/client/Contratos/Historialcontratos';
import ForgotPasswordPage from './pages/Auth/ForgotPassword';
import MisPujas from './pages/client/MiCuenta/MisPujas';

// --- PÁGINAS ADMIN (Lazy Loading) ---
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard/AdminDashboard'));
const AdminKYC = lazy(() => import('./pages/Admin/Usuarios/AdminKYC'));
const AdminProyectos = lazy(() => import('./pages/Admin/Proyectos/AdminProyectos'));
const AdminPujas = lazy(() => import('./pages/Admin/Pujas/AdminPujas'));
const AdminLotes = lazy(() => import('./pages/Admin/Lotes/AdminLotes'));
const AdminUsuarios = lazy(() => import('./pages/Admin/Usuarios/AdminUsuarios'));
const AdminSuscripciones = lazy(() => import('./pages/Admin/Suscripciones/AdminSuscripciones'));
const AdminInversiones = lazy(() => import('./pages/Admin/Inversiones/AdminInversiones'));


const AdminPagos = lazy(() => import('./pages/Admin/Finanzas/Pagos/AdminPagos'));
const AdminLotePagos = lazy(() => import('./pages/Admin/Lotes/AdminLotePagos'));
const AdminPlantillas = lazy(() => import('./pages/Admin/Contrato/AdminPlantillas'));
const AdminTransacciones = lazy(() => import('./pages/Admin/Finanzas/Transacciones/AdminTransacciones'));
const AdminContratosFirmados = lazy(() => import('./pages/Admin/Contrato/AdminContratosFirmados'));
const AdminResumenesCuenta = lazy(() => import('./pages/Admin/Finanzas/ResumenesCuenta/AdminResumenesCuenta'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// Loading inicial de la App (Verificando sesión)
const AppLoadingScreen: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
    <Box textAlign="center">
      <CircularProgress size={60} thickness={4} />
      <Box mt={2} color="text.secondary" fontWeight={500}>Cargando...</Box>
    </Box>
  </Box>
);

// Loading para rutas Lazy (Cambio de página)
const LazyLoadingFallback: React.FC = () => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    bgcolor: 'background.default'
  }}>
    <Box textAlign="center">
      <CircularProgress size={50} thickness={4} />
      <Box mt={2} color="text.secondary" fontWeight={500}>Cargando módulo...</Box>
    </Box>
  </Box>
);

// ✅ COMPONENTE CONECTOR: Inicializa el puente entre Axios y React
const GlobalSnackbarConfigurator = () => {
  const { showSuccess, showError, showInfo } = useSnackbar();

  useEffect(() => {
    setGlobalSnackbar((msg, type) => {
      if (type === 'success') showSuccess(msg);
      else if (type === 'error') showError(msg);
      else if (type === 'warning') showInfo(msg); 
      else showInfo(msg);
    });
  }, [showSuccess, showError, showInfo]);

  return null;
};

const AppContent: React.FC = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) return <AppLoadingScreen />;

  return (
    <Suspense fallback={<LazyLoadingFallback />}>
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
          <Route path="/proyectos/rol-seleccion" element={<RoleSelection />} />

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
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/kyc" element={<VerificacionKYC />} />
            <Route path="/pagos" element={<MisPagos />} />
            <Route path="/mensajes" element={<MensajesPage />} />
            <Route path="/seguridad" element={<SecuritySettings />} />
            <Route path="/suscripciones" element={<MisSuscripciones />} />
            <Route path="/favoritos" element={<MisFavoritos />} />
            <Route path="/pujas" element={<MisPujas />} />
            <Route path="/contratos" element={<HistorialContratos />} />
            <Route path="/lotes/:id" element={<DetalleLote />} />
            <Route path="/inversiones" element={<MisInversiones />} />
            <Route path="/pago-estado" element={<PagoResult />} />
            <Route path="/transacciones" element={<MisTransacciones />} />
            <Route path="/resumenes" element={<MisResumenes />} />
          </Route>
        </Route>

        {/* ================================================= */}
        {/* 🔴 ZONA ADMINISTRADOR (AdminLayout) - Lazy        */}
        {/* ================================================= */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/proyectos/ProyectosAhorrista" element={<ProyectosAhorrista />} />
             <Route path="/proyectos/ProyectosInversionista" element={<ProyectosInversionista />} />
            <Route path="/admin/plantillas" element={<AdminPlantillas />} />
            <Route path="/admin/firmados" element={<AdminContratosFirmados />} />
            
            <Route path="/admin/resumenes" element={<AdminResumenesCuenta />} />
            <Route path="/admin/transacciones" element={<AdminTransacciones />} />
            <Route path="/admin/kyc" element={<AdminKYC />} />
            <Route path="/admin/proyectos" element={<AdminProyectos />} />
            <Route path="/admin/suscripciones" element={<AdminSuscripciones />} />
            <Route path="/admin/inversiones" element={<AdminInversiones />} />
            <Route path="/admin/lotes" element={<AdminLotes />} />
          
            <Route path="/admin/pagos" element={<AdminPagos />} />
            <Route path="/admin/AdminLotePagos" element={<AdminLotePagos />} />
            <Route path="/admin/Pujas" element={<AdminPujas />} />
          </Route>
        </Route>  

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* ✅ 1. Proveedor Global de Snackbar */}
      <SnackbarProvider>
        
        {/* ✅ 2. Conector del Puente Axios <-> React */}
        <GlobalSnackbarConfigurator />

        <Router>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </Router>

      </SnackbarProvider>
      
    </ThemeProvider>
  );
};

export default App;