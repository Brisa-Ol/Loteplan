// src/routes/ProtectedRoute/ProtectedRoute.tsx (VERSIÓN MEJORADA CON ROLES)

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth.types';
import { usePermissions } from '../../hook/usePermissions';

interface ProtectedRouteProps {
  requiredRoles?: UserRole[]; // ⬅️ 2. Aceptamos una lista opcional de roles requeridos
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles = [] }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const permissions = usePermissions(); // ⬅️ 3. Obtenemos los permisos del usuario actual
  const location = useLocation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, siempre lo mandamos al login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 4. ❗ LÓGICA DE ROLES
  // Si esta ruta requiere roles específicos Y el usuario no tiene ninguno de ellos...
  if (requiredRoles.length > 0 && !permissions.hasRole(requiredRoles)) {
    // ...lo mandamos a una página de "No Autorizado".
    // Esto es mejor que mandarlo al login, porque ya está logueado.
    return <Navigate to="/unauthorized" replace />; 
  }

  // Si pasó todos los chequeos, lo dejamos pasar a la ruta hija.
  return <Outlet />;
};