import React from 'react';
import { usePermissions } from '@/shared/hooks/usePermissions'; // Ajusta la ruta si es necesario

// Definimos los roles válidos según tu backend
type UserRole = 'admin' | 'cliente';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[]; // Arreglo de roles permitidos
  fallback?: React.ReactNode; // Lo que se muestra si no tiene permiso
  requireAdmin?: boolean;     // Shortcut para requerir admin
  requireCliente?: boolean;   // Shortcut para requerir cliente
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

  // 1. Verificación de Admin explícita
  if (requireAdmin && !permissions.isAdmin) {
    return <>{fallback}</>;
  }

  // 2. Verificación de Cliente explícita
  if (requireCliente && !permissions.isCliente) {
    return <>{fallback}</>;
  }

  // 3. Verificación de lista de roles
  if (requiredRoles.length > 0 && !permissions.hasRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Si pasa todas las verificaciones, muestra el contenido
  return <>{children}</>;
};

export default PermissionGuard;