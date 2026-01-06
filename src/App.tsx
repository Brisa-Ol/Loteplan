// src/App.tsx

import React, { Suspense, useEffect } from 'react'; // ✅ Agregado useEffect
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';
// ✅ Importamos el Contexto y el Setter del puente
import { SnackbarProvider, useSnackbar } from './context/SnackbarContext'; 
import { setGlobalSnackbar } from './utils/snackbarUtils'; 

// --- LAYOUTS (carga inmediata - se usan siempre) ---
import ClientNavbar from './components/layout/Navbar/ClientNavbar';
import AdminLayout from './components/layout/Navbar/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute/ProtectedRoute';

// --- PÁGINAS PÚBLICAS (lazy loading) ---
const Home = React.lazy(() => import('./pages/Home/Home'));
const Ahorrista = React.lazy(() => import('./pages/ComoFunciona/Ahorrista/Ahorrista'));
const Inversionista = React.lazy(() => import('./pages/ComoFunciona/Inversionista/Inversionista'));
const Preguntas = React.lazy(() => import('./pages/Preguntas/Preguntas'));
const Nosotros = React.lazy(() => import('./pages/Nosotros/Nosotros'));

// --- PÁGINAS AUTH (lazy loading) ---
const Register = React.lazy(() => import('./pages/Auth/Register'));
const ForgotPasswordPage = React.lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage'));
const ConfirmEmailPage = React.lazy(() => import('./pages/Auth/ConfirmEmailPage'));
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const Unauthorized = React.lazy(() => import('./pages/Auth/Unauthorized'));

// --- PÁGINAS CLIENTE (lazy loading) ---
const Perfil = React.lazy(() => import('./pages/client/MiCuenta/Perfil'));
const MisSuscripciones = React.lazy(() => import('./pages/client/MiCuenta/MisSuscripciones'));
const ProyectosAhorrista = React.lazy(() => import('./pages/client/Proyectos/ProyectosAhorrista'));
const ProyectosInversionista = React.lazy(() => import('./pages/client/Proyectos/ProyectosInversionista'));
const UserDashboard = React.lazy(() => import('./pages/client/UserDashboard/UserDashboard'));
const SecuritySettings = React.lazy(() => import('./pages/client/MiCuenta/SecuritySettings'));
const RoleSelection = React.lazy(() => import('./pages/client/Proyectos/RoleSelection'));
const MensajesPage = React.lazy(() => import('./pages/client/MiCuenta/MensajesPage'));
const MisSubastas = React.lazy(() => import('./pages/client/MiCuenta/MisPujas'));
const VerificacionKYC = React.lazy(() => import('./pages/client/MiCuenta/VerificacionKYC'));
const DetalleProyecto = React.lazy(() => import('./pages/client/Proyectos/DetalleProyecto'));
const MisInversiones = React.lazy(() => import('./pages/client/MiCuenta/MisInversiones'));
const MisPagos = React.lazy(() => import('./pages/client/MiCuenta/Pagos/MisPagos'));
const MisResumenes = React.lazy(() => import('./pages/client/MiCuenta/MisResumenes'));
const PagoResult = React.lazy(() => import('./pages/client/MiCuenta/Pagos/PagoResult'));
const MisTransacciones = React.lazy(() => import('./pages/client/MiCuenta/Pagos/MisTransacciones'));
const MisFavoritos = React.lazy(() => import('./pages/client/MiCuenta/MisFavoritos'));
const DetalleLote = React.lazy(() => import('./pages/client/Lotes/DetalleLote'));
const HistorialContratos = React.lazy(() => import('./pages/client/Contratos/Historialcontratos'));

// --- PÁGINAS ADMIN (lazy loading) ---
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard/AdminDashboard'));
const AdminKYC = React.lazy(() => import('./pages/Admin/Usuarios/AdminKYC'));
const AdminProyectos = React.lazy(() => import('./pages/Admin/Proyectos/AdminProyectos'));
const SalaControlPujas = React.lazy(() => import('./pages/Admin/Pujas/SalaControlPujas'));
const InventarioLotes = React.lazy(() => import('./pages/Admin/Lotes/AdminLotes'));
const AdminUsuarios = React.lazy(() => import('./pages/Admin/Usuarios/AdminUsuarios'));
const AdminSuscripciones = React.lazy(() => import('./pages/Admin/Suscripciones/AdminSuscripciones'));
const AdminInversiones = React.lazy(() => import('./pages/Admin/Inversiones/AdminInversiones'));

const AdminPagos = React.lazy(() => import('./pages/Admin/Finanzas/Pagos/AdminPagos'));
const LotePagos = React.lazy(() => import('./pages/Admin/Lotes/AdminLotePagos'));
const AdminPlantillas = React.lazy(() => import('./pages/Admin/Contrato/AdminPlantillas'));
const AdminTransacciones = React.lazy(() => import('./pages/Admin/Finanzas/Transacciones/AdminTransacciones'));
const AdminContratosFirmados = React.lazy(() => import('./pages/Admin/Contrato/AdminContratosFirmados'));
const AdminResumenesCuenta = React.lazy(() => import('./pages/Admin/Finanzas/ResumenesCuenta/AdminResumenesCuenta'));

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

// ✅ NUEVO COMPONENTE: Configura el puente entre Axios y React
// Este componente no renderiza nada visual, solo conecta la lógica.
const GlobalSnackbarConfigurator = () => {
  const { showSuccess, showError, showInfo } = useSnackbar();

  useEffect(() => {
    // Aquí le decimos a 'utils/snackbarUtils' qué funciones de React debe usar
    setGlobalSnackbar((msg, type) => {
      if (type === 'success') showSuccess(msg);
      else if (type === 'error') showError(msg);
      else if (type === 'warning') showInfo(msg); // Asumiendo que showInfo maneja warning o tienes showWarning
      else showInfo(msg);
    });
  }, [showSuccess, showError, showInfo]);

  return null;
};

const AppContent: React.FC = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) return <AppLoadingScreen />;

  return (
    <Suspense fallback={<AppLoadingScreen />}>
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

            <Route path="/Admin/Lotes" element={<InventarioLotes />} />
            <Route path="/admin/Pagos" element={<AdminPagos />} />
            <Route path="/admin/LotePagos" element={<LotePagos />} />
            <Route path="/admin/SalaControlPujas" element={<SalaControlPujas />} />
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
      
      {/* 1. Proveedor Global */}
      <SnackbarProvider>
        
        {/* 2. ✅ COMPONENTE CONECTOR: Inicializa el puente aquí dentro */}
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