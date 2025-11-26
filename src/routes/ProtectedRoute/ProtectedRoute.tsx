import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface Props {
  allowedRoles?: ('admin' | 'cliente')[];
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar loader mientras carga
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 1. Si no está autenticado, ir a Login (guardando de dónde venía)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 2. Si hay roles restringidos y el usuario no tiene el rol adecuado
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Redirigir al dashboard correspondiente según su rol
    if (user.rol === 'admin') {
      return <Navigate to="/Admin/Dashboard/AdminDashboard" replace />;
    } else if (user.rol === 'cliente') {
      return <Navigate to="/client/UserDashboard/UserDashboard" replace />;
    }
    // Fallback: volver al login
    return <Navigate to="/login" replace />;
  }

  // 3. Si pasa las validaciones, renderizar la ruta hija
  return <Outlet />;
};

export default ProtectedRoute;