// src/routes/AppRouter.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Guards
import ProtectedRoute from './ProtectedRoute/ProtectedRoute';
import { ROUTES } from '.';
import ClientNavbar from '@/shared/components/layout/navigation/ClientNavbar';


// ============ LAZY LOADING ============

// Layouts
const AdminLayout = lazy(() => import('@/shared/layouts/AdminLayout'));
// ✅ IMPORTANTE: Agregamos el ClientLayout (Asegúrate de haber creado el archivo del paso 1)

// Auth Pages (No usan layout, o usan uno simple)
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const Register = lazy(() => import('@/features/auth/pages/Register'));
const ForgotPassword = lazy(() => import('@/features/auth/pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const ConfirmEmailPage = lazy(() => import('@/features/auth/pages/ConfirmEmailPage'));
const Unauthorized = lazy(() => import('@/features/auth/pages/Unauthorized'));

// Public
const Home = lazy(() => import('@/features/public/Home/Home'));
const ComoFunciona = lazy(() => import('@/features/public/ComoFunciona/ComoFunciona'));
const Nosotros = lazy(() => import('@/features/public/Nosotros/Nosotros'));
const Preguntas = lazy(() => import('@/features/public/Preguntas/Preguntas'));

// Proyectos (Shared / Client)
const RoleSelection = lazy(() => import('@/features/client/pages/Proyectos/RoleSelection'));
const ProyectosAhorrista = lazy(() => import('@/features/client/pages/Proyectos/ProyectosAhorrista'));
const ProyectosInversionista = lazy(() => import('@/features/client/pages/Proyectos/ProyectosInversionista'));
const DetalleProyecto = lazy(() => import('@/features/client/pages/Proyectos/DetalleProyecto'));

// Client - Dashboard & Features
const UserDashboard = lazy(() => import('@/features/client/pages/UserDashboard/UserDashboard'));
const MisPagos = lazy(() => import('@/features/client/pages/MiCuenta/Pagos/MisPagos'));
const MisInversiones = lazy(() => import('@/features/client/pages/MiCuenta/MisInversiones'));
const MisSuscripciones = lazy(() => import('@/features/client/pages/MiCuenta/MisSuscripciones'));
const MisPujas = lazy(() => import('@/features/client/pages/MiCuenta/MisPujas'));
const MisTransacciones = lazy(() => import('@/features/client/pages/MiCuenta/Pagos/MisTransacciones'));
const MisResumenes = lazy(() => import('@/features/client/pages/MiCuenta/MisResumenes'));
const PagoResult = lazy(() => import('@/features/client/pages/MiCuenta/Pagos/PagoResult'));
const Perfil = lazy(() => import('@/features/client/pages/MiCuenta/Perfil'));
const VerificacionKYC = lazy(() => import('@/features/client/pages/MiCuenta/VerificacionKYC'));
const MensajesPage = lazy(() => import('@/features/client/pages/MiCuenta/MensajesPage'));
const SecuritySettings = lazy(() => import('@/features/client/pages/MiCuenta/SecuritySettings'));
const MisFavoritos = lazy(() => import('@/features/client/pages/MiCuenta/MisFavoritos'));
const Historialcontratos = lazy(() => import('@/features/client/pages/Contratos/Historialcontratos'));
const DetalleLote = lazy(() => import('@/features/client/pages/Lotes/DetalleLote'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/features/admin/pages/Dashboard/AdminDashboard'));
const AdminUsuarios = lazy(() => import('@/features/admin/pages/Usuarios/AdminUsuarios'));
const AdminKYC = lazy(() => import('@/features/admin/pages/Usuarios/AdminKYC'));
const AdminProyectos = lazy(() => import('@/features/admin/pages/Proyectos/AdminProyectos'));
const AdminSuscripciones = lazy(() => import('@/features/admin/pages/Suscripciones/AdminSuscripciones'));
const AdminInversiones = lazy(() => import('@/features/admin/pages/Inversiones/AdminInversiones'));
const AdminLotes = lazy(() => import('@/features/admin/pages/Lotes/AdminLotes'));
const AdminLotePagos = lazy(() => import('@/features/admin/pages/Lotes/AdminLotePagos'));
const AdminPujas = lazy(() => import('@/features/admin/pages/Pujas/AdminPujas'));
const AdminPlantillas = lazy(() => import('@/features/admin/pages/Contrato/AdminPlantillas'));
const AdminContratosFirmados = lazy(() => import('@/features/admin/pages/Contrato/AdminContratosFirmados'));
const AdminPagos = lazy(() => import('@/features/admin/pages/Finanzas/Pagos/AdminPagos'));
const AdminTransacciones = lazy(() => import('@/features/admin/pages/Finanzas/Transacciones/AdminTransacciones'));
const AdminResumenesCuenta = lazy(() => import('@/features/admin/pages/Finanzas/ResumenesCuenta/AdminResumenesCuenta'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        
        {/* ==========================================================
            1. RUTAS STANDALONE (Sin Navbar ni Sidebar)
           ========================================================== */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.CONFIRM_EMAIL} element={<ConfirmEmailPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

        {/* ==========================================================
            2. RUTAS PÚBLICAS Y DE CLIENTE (Usan ClientLayout)
           ========================================================== */}
        <Route element={<ClientNavbar />}>
          
          {/* Rutas Públicas */}
          <Route path={ROUTES.PUBLIC.HOME} element={<Home />} />
          <Route path={ROUTES.PUBLIC.COMO_FUNCIONA} element={<ComoFunciona />} />
          <Route path={ROUTES.PUBLIC.NOSOTROS} element={<Nosotros />} />
          <Route path={ROUTES.PUBLIC.PREGUNTAS} element={<Preguntas />} />

          {/* Rutas Protegidas de Cliente (Requieren Auth) */}
          {/* Proyectos */}
          <Route path={ROUTES.PROYECTOS.SELECCION_ROL} element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
          <Route path={ROUTES.PROYECTOS.AHORRISTA} element={<ProtectedRoute><ProyectosAhorrista /></ProtectedRoute>} />
          <Route path={ROUTES.PROYECTOS.INVERSIONISTA} element={<ProtectedRoute><ProyectosInversionista /></ProtectedRoute>} />
          <Route path={ROUTES.PROYECTOS.DETALLE} element={<ProtectedRoute><DetalleProyecto /></ProtectedRoute>} />

          {/* Dashboard Cliente */}
          <Route path={ROUTES.CLIENT.DASHBOARD} element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

          {/* Finanzas */}
          <Route path={ROUTES.CLIENT.FINANZAS.PAGOS} element={<ProtectedRoute><MisPagos /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.FINANZAS.INVERSIONES} element={<ProtectedRoute><MisInversiones /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.FINANZAS.SUSCRIPCIONES} element={<ProtectedRoute><MisSuscripciones /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.FINANZAS.PUJAS} element={<ProtectedRoute><MisPujas /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.FINANZAS.TRANSACCIONES} element={<ProtectedRoute><MisTransacciones /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.FINANZAS.RESUMENES} element={<ProtectedRoute><MisResumenes /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.FINANZAS.PAGO_ESTADO} element={<ProtectedRoute><PagoResult /></ProtectedRoute>} />

          {/* Cuenta */}
          <Route path={ROUTES.CLIENT.CUENTA.PERFIL} element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.CUENTA.KYC} element={<ProtectedRoute><VerificacionKYC /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.CUENTA.MENSAJES} element={<ProtectedRoute><MensajesPage /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.CUENTA.SEGURIDAD} element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.CUENTA.FAVORITOS} element={<ProtectedRoute><MisFavoritos /></ProtectedRoute>} />
          <Route path={ROUTES.CLIENT.CUENTA.HISTORIAL_CONTRATOS} element={<ProtectedRoute><Historialcontratos /></ProtectedRoute>} />

          {/* Lotes */}
          <Route path={ROUTES.CLIENT.LOTES.DETALLE} element={<ProtectedRoute><DetalleLote /></ProtectedRoute>} />
        </Route>

        {/* ==========================================================
            3. RUTAS DE ADMINISTRADOR (Usan AdminLayout)
           ========================================================== */}
        <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="kyc" element={<AdminKYC />} />
          
          <Route path="proyectos" element={<AdminProyectos />} />
          <Route path="suscripciones" element={<AdminSuscripciones />} />
          <Route path="inversiones" element={<AdminInversiones />} />
          
          <Route path="lotes" element={<AdminLotes />} />
          <Route path="lote-pagos" element={<AdminLotePagos />} />
          <Route path="pujas" element={<AdminPujas />} />
          
          <Route path="plantillas" element={<AdminPlantillas />} />
          <Route path="firmados" element={<AdminContratosFirmados />} />
          
          <Route path="pagos" element={<AdminPagos />} />
          <Route path="transacciones" element={<AdminTransacciones />} />
          <Route path="resumenes" element={<AdminResumenesCuenta />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.PUBLIC.HOME} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;