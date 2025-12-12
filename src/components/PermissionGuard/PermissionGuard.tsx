import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

// ✅ Definimos el tipo de rol basado en tu AuthContext/DTO
type UserRole = 'admin' | 'cliente';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[]; // Arreglo de roles permitidos
  fallback?: React.ReactNode; // Lo que se muestra si no tiene permiso (ej: nada, o un mensaje)
  requireAdmin?: boolean;     // Shortcut para requerir admin
  requireCliente?: boolean;   // Shortcut para requerir cliente
}

/**
 * Componente para renderizar contenido condicionalmente según permisos.
 * @example
 * <PermissionGuard requireAdmin fallback={<Forbidden />}>
 * <AdminPanel />
 * </PermissionGuard>
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

  // 3. Verificación de lista de roles (usa tu helper hasRole que acepta arrays)
  if (requiredRoles.length > 0 && !permissions.hasRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Si pasa todas las verificaciones, muestra el contenido
  return <>{children}</>;
};

export default PermissionGuard;