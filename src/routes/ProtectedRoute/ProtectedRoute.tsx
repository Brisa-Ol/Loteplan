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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 1. Si no está autenticado, ir a Login (guardando de dónde venía)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si hay roles restringidos y el usuario no tiene el rol adecuado
  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />; // O al dashboard cliente
  }

  // 3. Si pasa las validaciones, renderizar la ruta hija
  return <Outlet />;
};

export default ProtectedRoute;