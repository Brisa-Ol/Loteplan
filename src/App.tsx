// src/App.tsx
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
import Unauthorized from "./pages/Unauthorized";
import ForgotPasswordPage from "./pages/Auth/components/ForgotPassword/ForgotPassword";

// Providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/AuthContext";

// Rutas Protegidas
import { ProtectedRoute } from "./routes/ProtectedRoute/ProtectedRoute";

// Mi Cuenta (cliente)
import MiCuentaPerfil from "./pages/MiCuenta/Perfil";
import MisPagos from "./pages/MiCuenta/MisPagos";
import MisSuscripciones from "./pages/MiCuenta/Suscripciones";

// Admin
import AdminDashboard from "./pages/Admin/AdminDashboard"; // ✅ ya enlazado

// ──────────────────────────────────────────────────────────
// REACT QUERY CLIENT
// ──────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // evita refetch cada vez que cambiás de pestaña
      retry: 1,
      staleTime: 1000 * 60 * 2, // cache por 2 minutos
    },
  },
});

// ──────────────────────────────────────────────────────────
// LAYOUT BASE
// ──────────────────────────────────────────────────────────
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar /> {/* ✅ Usa tu NavbarBase internamente */}
      <Box component="main" sx={{ flexGrow: 1, width: "100%" }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

// ──────────────────────────────────────────────────────────
// APP PRINCIPAL
// ──────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Layout>
              <Routes>
                {/* --- RUTAS PÚBLICAS --- */}
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

                {/* --- RUTAS CLIENTE --- */}
                <Route element={<ProtectedRoute requiredRoles={["cliente"]} />}>
                  <Route path="/mi-cuenta/pagos" element={<MisPagos />} />
                  <Route path="/mi-cuenta/suscripciones" element={<MisSuscripciones />} />
                </Route>

                {/* --- RUTAS ADMIN --- */}
                <Route element={<ProtectedRoute requiredRoles={["admin"]} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  {/* Futuras rutas: <Route path="/admin/users" ... /> etc. */}
                </Route>

                {/* --- RUTAS COMPARTIDAS --- */}
                <Route element={<ProtectedRoute requiredRoles={["cliente", "admin"]} />}>
                  <Route path="/mi-cuenta/perfil" element={<MiCuentaPerfil />} />
                </Route>

                {/* --- RUTAS FALLBACK --- */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Layout>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} /> {/* ✅ para debug */}
        </QueryClientProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
