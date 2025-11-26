import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';

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
import VerificacionKYC from './pages/client/MiCuenta/VerificacionKYC';
import MisPagos from './pages/client/MiCuenta/MisPagos';
import MisSuscripciones from './pages/client/MiCuenta/Suscripciones';
import MisPujas from './pages/client/MiCuenta/MisPujas';
import MisDocumentos from './pages/client/MiCuenta/MisDocumentos';
import ProyectosAhorrista from './pages/client/Proyectos/ProyectosAhorrista';
import ProyectosInversionista from './pages/client/Proyectos/ProyectosInversionista';
import DetalleProyecto from './pages/client/Proyectos/DetalleProyecto';

// --- PÁGINAS ADMIN ---
import AdminUsuarios from './pages/Admin/AdminUsuarios';
import AdminKYC from './pages/Admin/AdminKYC';
import AdminProyectos from './pages/Admin/Proyectos/Proyectos/AdminProyectos';


import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import UserDashboard from './pages/client/UserDashboard/UserDashboard';
import AdminLotes from './pages/Admin/Lotes/AdminLotes';
import AdminSubastas from './pages/Admin/Lotes/AdminSubastas';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              
              {/* ================================================= */}
              {/* 🟢 RUTAS PÚBLICAS Y CLIENTE (Usan ClientNavbar)  */}
              {/* ================================================= */}
              <Route element={<ClientNavbar />}>
                {/* A. Páginas Públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/ahorrista" element={<Ahorrista />} />
                <Route path="/inversionista" element={<Inversionista />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/preguntas" element={<Preguntas />} />
                
                {/* B. Auth (Públicas) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/confirmar_email/:token" element={<ConfirmEmailPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* C. Rutas Protegidas de CLIENTE */}
                <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
                  {/* ✅ ESTA ES LA RUTA CORRECTA PARA EL DASHBOARD DE CLIENTE */}
                  <Route path="/client/UserDashboard/UserDashboard" element={<UserDashboard />} />
                  <Route path="/mi-cuenta/perfil" element={<Perfil />} />
                  <Route path="/mi-cuenta/verificacion-kyc" element={<VerificacionKYC />} />
                  <Route path="/mi-cuenta/pagos" element={<MisPagos />} />
                  <Route path="/mi-cuenta/suscripciones" element={<MisSuscripciones />} />
                  <Route path="/mi-cuenta/pujas" element={<MisPujas />} />
                  <Route path="/mi-cuenta/documentos" element={<MisDocumentos />} />
                  <Route path="/proyectos/ahorrista" element={<ProyectosAhorrista />} />
                  <Route path="/proyectos/inversionista" element={<ProyectosInversionista />} />
                  <Route path="/proyectos/:id" element={<DetalleProyecto />} />
                </Route>
              </Route>

              {/* ================================================= */}
              {/* 🔴 RUTAS ADMIN (Usan AdminLayout)                */}
              {/* ================================================= */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  {/* ✅ ESTA ES LA RUTA CORRECTA PARA EL DASHBOARD DE ADMIN */}
                  <Route path="/Admin/Dashboard/AdminDashboard" element={<AdminDashboard />} />
                  <Route path="/Admin/AdminUsuarios" element={<AdminUsuarios />} />
                 {/* <Route path="/Admin/AdminKYC" element={<AdminKYC />} />*/}
                  <Route path="/Admin/Proyectos/Proyectos/AdminProyectos" element={<AdminProyectos />} />
                  <Route path="/Admin/Lotes/AdminLotes" element={<AdminLotes />} />
                  <Route path="/Admin/Lotes/AdminSubastas" element={<AdminSubastas />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;