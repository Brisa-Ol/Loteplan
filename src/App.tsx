import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';

// Layouts (NUEVOS)


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
import Login from './pages/Auth/LoginPage';
import Register from './pages/Auth/Register';
import ForgotPasswordPage from './pages/Auth/components/ForgotPassword/ForgotPassword';
import ResetPasswordPage from './pages/Auth/components/ResetPasswordPage';
import ConfirmEmailPage from './pages/Auth/ConfirmEmailPage';

// --- PÁGINAS CLIENTE ---
import UserDashboard from './pages/client/UserDashboard/UserDashboard';
import Perfil from './pages/client/MiCuenta/Perfil';
import VerificacionKYC from './pages/client/MiCuenta/VerificacionKYC';
import MisPagos from './pages/client/MiCuenta/MisPagos';
 // ⚠️ Verifica nombre archivo real
import MisPujas from './pages/client/MiCuenta/MisPujas';
import MisDocumentos from './pages/client/MiCuenta/MisDocumentos';

import ProyectosAhorrista from './pages/client/Proyectos/ProyectosAhorrista';
import ProyectosInversionista from './pages/client/Proyectos/ProyectosInversionista';
import DetalleProyecto from './pages/client/Proyectos/DetalleProyecto';

// --- PÁGINAS ADMIN ---
import AdminDashboard from './pages/Admin/AdminUsuarios'; // Placeholder o real
import AdminUsuarios from './pages/Admin/Usuarios/AdminUsuarios';
import AdminKYC from './pages/Admin/AdminKYC';
import AdminLayout from './components/layout/Navbar/AdminLayout';
import AdminProyectos from './pages/Admin/Proyectos/Proyectos/AdminProyectos';
import MisSuscripciones from './pages/client/MiCuenta/Suscripciones';
import ClientLayout from './components/layout/Navbar/ClientLayout';


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
              {/* 🌍 GRUPO 1: VISUALIZACIÓN CLIENTE (Navbar Arriba) */}
              {/* ================================================= */}
              
              {/* A. Rutas Públicas (Sin Login) */}
              <Route element={<ClientLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/ahorrista" element={<Ahorrista />} />
                <Route path="/inversionista" element={<Inversionista />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/preguntas" element={<Preguntas />} />
                
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/confirmar_email/:token" element={<ConfirmEmailPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
              </Route>

              {/* B. Rutas Privadas Cliente (Requiere Login) */}
              <Route element={<ProtectedRoute allowedRoles={['cliente', 'admin']} />}>
                <Route element={<ClientLayout />}> {/* Mismo layout visual */}
                  
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/verificacion-kyc" element={<VerificacionKYC />} />

                  {/* Catálogos */}
                  <Route path="/proyectos/ahorrista" element={<ProyectosAhorrista />} />
                  <Route path="/proyectos/inversionista" element={<ProyectosInversionista />} />
                  <Route path="/proyectos/:id" element={<DetalleProyecto />} />
                  
                  {/* Gestión */}
                  <Route path="/mis-pagos" element={<MisPagos />} />
                  <Route path="/mis-suscripciones" element={<MisSuscripciones />} />
                  <Route path="/mis-pujas" element={<MisPujas />} />
                  <Route path="/mis-documentos" element={<MisDocumentos />} />
                  
                </Route>
              </Route>

              {/* ================================================= */}
              {/* 👮 GRUPO 2: VISUALIZACIÓN ADMIN (Sidebar Izq)   */}
              {/* ================================================= */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}> {/* Layout Diferente */}
                   <Route path="/admin/dashboard" element={<AdminDashboard />} />
                   <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                   <Route path="/admin/kyc" element={<AdminKYC />} />
                   <Route path="/admin/proyectos" element={<AdminProyectos />} />
                   {/* Agregar rutas de lotes aquí */}
                </Route>
              </Route>

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