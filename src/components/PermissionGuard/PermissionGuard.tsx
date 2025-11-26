// src/components/PermissionGuard/PermissionGuard.tsx
import React from 'react';

import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
  requireCliente?: boolean;
}

/**
 * Componente para renderizar contenido condicionalmente según permisos.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRoles = [],
  fallback = null,
  requireAdmin = false,
  requireCliente = false,
}) => {
  const permissions = usePermissions();

  if (requireAdmin && !permissions.isAdmin) {
    return <>{fallback}</>;
  }

  if (requireCliente && !permissions.isCliente) {
    return <>{fallback}</>;
  }

  if (requiredRoles.length > 0 && !permissions.hasRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;