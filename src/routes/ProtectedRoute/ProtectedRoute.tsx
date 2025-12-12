import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface Props {
  allowedRoles?: ('admin' | 'cliente')[];
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  // ✅ 1. IMPORTANTE: Traemos isInitializing
  const { isAuthenticated, isLoading, isInitializing, user } = useAuth();
  const location = useLocation();

  // ✅ 2. Bloqueamos la vista si está cargando (API) O inicializando (Local Storage)
  if (isLoading || isInitializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 3. Si no está autenticado, ir a Login (guardando de dónde venía)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 4. Si hay roles restringidos y el usuario no tiene el rol adecuado
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Redirigir al dashboard correspondiente según su rol (Rutas limpias)
    if (user.rol === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.rol === 'cliente') {
      return <Navigate to="/client/dashboard" replace />;
    }
    
    // Fallback: Si el rol no coincide con nada conocido, mandarlo a login o unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. Si pasa las validaciones, renderizar la ruta hija
  return <Outlet />;
};

export default ProtectedRoute;