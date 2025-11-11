// src/hook/usePermissions.ts

import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/dto/auth.types";


interface PermissionCheck {
  isAdmin: boolean;
  isCliente: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

/**
 * Hook para verificar permisos del usuario actual
 */
export const usePermissions = (): PermissionCheck => {
  const { user } = useAuth();

  return useMemo(() => {
    const isAdmin = user?.rol === "admin";
    const isCliente = user?.rol === "cliente";

    const hasRole = (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.rol);
    };

    return {
      isAdmin,
      isCliente,
      hasRole,
    };
  }, [user]);
};