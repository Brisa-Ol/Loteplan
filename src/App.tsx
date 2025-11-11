// src/App.tsx (CORREGIDO CON RUTAS SEPARADAS)
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import theme from "./theme";

// Layout Components
import Navbar from "./components/layout/Navbar/Navbar";
import Footer from "./components/layout/Footer/Footer";

// Pages
import Home from "./pages/Home/Home";
import ProyectosAhorrista from "./pages/Proyectos/ProyectosAhorrista";
import ProyectosInversionista from "./pages/Proyectos/ProyectosInversionista";
import ProyectoDetail from "./pages/Proyectos/ProyectoDetail";
import Ahorrista from "./pages/ComoFunciona/Ahorrista/Ahorrista";
import Inversionista from "./pages/ComoFunciona/Inversionista/Inversionista";
import Preguntas from "./pages/Preguntas/Preguntas";
import Login from "./pages/Auth/LoginPage";
import Register from "./pages/Auth/Register";
import Nosotros from "./pages/Nosotros/Nosotros";
import RoleSelection from "./pages/Proyectos/RoleSelection";

// Providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "./context/AuthContext";

// Rutas Protegidas
import { ProtectedRoute } from "./routes/ProtectedRoute/ProtectedRoute";
import MiCuentaPerfil from "./pages/MiCuenta/Perfil";
import MisPagos from "./pages/MiCuenta/MisPagos";
import MisSuscripciones from "./pages/MiCuenta/Suscripciones";
import Unauthorized from "./pages/Unauthorized";
import ForgotPasswordPage from "./pages/Auth/components/ForgotPassword/ForgotPassword";
// ❗ (Aquí deberás importar tus páginas de Admin cuando las crees)
// import AdminDashboard from "./pages/Admin/Dashboard";
// import AdminUsers from "./pages/Admin/Users";

const queryClient = new QueryClient();

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Layout>
              <Routes>
                {/* --- Rutas Públicas --- */}
                <Route path="/" element={<Home />} />
                <Route path="/ahorrista" element={<Ahorrista />} />
                <Route path="/inversionista" element={<Inversionista />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/preguntas" element={<Preguntas />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/proyectos" element={<RoleSelection />} />
                <Route path="/proyectos/ahorrista" element={<ProyectosAhorrista />} />
                <Route path="/proyectos/inversionista" element={<ProyectosInversionista />} />
                <Route path="/proyectos/:id" element={<ProyectoDetail />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* // ==========================================================
                // ❗ INICIO DE LA CORRECCIÓN DE RUTAS
                // ==========================================================
                */}

                {/* --- 1. Rutas de CLIENTE (Solo Cliente) --- */}
                <Route element={<ProtectedRoute requiredRoles={['cliente']} />}>
                  <Route path="/mi-cuenta/pagos" element={<MisPagos />} />
                  <Route path="/mi-cuenta/suscripciones" element={<MisSuscripciones />} />
                </Route>

                {/* --- 2. Rutas de ADMIN (Solo Admin) --- */}
                <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
                  {/* (Descomenta estas rutas cuando crees las páginas) */}
                  {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
                  {/* <Route path="/admin/users" element={<AdminUsers />} /> */}
                  {/* <Route path="/admin/proyectos" element={<AdminProyectos />} /> */}
                  {/* <Route path="/admin/kyc" element={<AdminKYC />} /> */}
                </Route>

                {/* --- 3. Rutas COMPARTIDAS (Cliente Y Admin) --- */}
                {/* Ambos roles pueden ver su propio perfil */}
                <Route element={<ProtectedRoute requiredRoles={['cliente', 'admin']} />}>
                  <Route path="/mi-cuenta/perfil" element={<MiCuentaPerfil />} />
                </Route>

                {/* // ==========================================================
                // ❗ FIN DE LA CORRECCIÓN DE RUTAS
                // ==========================================================
                */}

                {/* --- Rutas de Fallback --- */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Layout>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;