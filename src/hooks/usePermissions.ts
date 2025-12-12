// src/hooks/usePermissions.ts

import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();

  return useMemo(() => {
    // Verificación segura con Optional Chaining
    const isAdmin = user?.rol === "admin";
    const isCliente = user?.rol === "cliente";

    // Helper para verificar arrays de roles
    const hasRole = (role: string | string[]) => {
      if (!user?.rol) return false;
      if (Array.isArray(role)) {
        return role.includes(user.rol);
      }
      return user.rol === role;
    };

    return {
      isAdmin,
      isCliente,
      hasRole,
      role: user?.rol // Por si necesitas acceder al string directo
    };
  }, [user]);
};