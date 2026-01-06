// src/routes/ProtectedRoute/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Definimos los roles permitidos basados en tu DTO
type AllowedRole = 'admin' | 'cliente';

interface ProtectedRouteProps {
  allowedRoles?: AllowedRole[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // 1. Estado de Carga (Verificando Token)
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // 2. No Autenticado -> Redirigir al Login
  // Guardamos la ubicación actual en 'state.from' para volver después
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verificación de Rol (Autorización)
  // Si se requieren roles específicos y el usuario no tiene uno de ellos
  if (allowedRoles && user && !allowedRoles.includes(user.rol as AllowedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Acceso Permitido
  return <Outlet />;
};

export default ProtectedRoute;