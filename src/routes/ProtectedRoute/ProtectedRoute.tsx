// src/routes/ProtectedRoute/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Array de roles permitidos, ej: ['admin', 'cliente']
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // 1. Cargando: Si aún estamos verificando el token, mostramos un spinner
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // 2. NO LOGUEADO: Si intenta entrar sin sesión, lo mandamos al Login.
  // "state={{ from: location }}" sirve para que después de loguearse,
  // el sistema lo devuelva a la página que intentó visitar originalmente.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. LOGUEADO PERO SIN PERMISOS: Si tiene usuario pero su rol no está permitido.
  // Lo mandamos a la página de "Acceso Denegado" (Unauthorized).
  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. ACCESO PERMITIDO: Renderiza la ruta hija (el Outlet)
  return <Outlet />;
};

export default ProtectedRoute;