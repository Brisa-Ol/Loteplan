// src/routes/ProtectedRoute/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/core/context/AuthContext';




type AllowedRole = 'admin' | 'cliente';

interface ProtectedRouteProps {
  children?: React.ReactNode; // ✅ Necesario para envolver componentes
  allowedRoles?: AllowedRole[];
  requireAdmin?: boolean; // ✅ Agregado para soportar <ProtectedRoute requireAdmin>
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAdmin = false
}) => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // 1. Estado de Carga
  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // 2. No Autenticado -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Definir roles permitidos
  // Si requireAdmin es true, forzamos que el rol sea 'admin'
  const rolesToCheck = requireAdmin ? ['admin'] : allowedRoles;

  // 4. Verificación de Rol
  if (rolesToCheck.length > 0 && user && !rolesToCheck.includes(user.rol as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. Renderizar el componente hijo (o Outlet si usas layout routes)
  // El fragmento <>{children}</> permite renderizar lo que está dentro del Guard
  return <>{children}</>;
};

export default ProtectedRoute;