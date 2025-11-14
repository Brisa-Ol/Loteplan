// src/utils/roleBasedRedirect.ts

import type { UserRole } from "../types/dto/usuario.dto";


/**
 * Retorna la ruta de dashboard predeterminada según el rol del usuario
 */
export const getDefaultRouteByRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'cliente':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

/**
 * Verifica si una ruta es accesible para un rol específico
 */
export const isRouteAccessibleByRole = (route: string, role: UserRole): boolean => {
  // Rutas de admin
  if (route.startsWith('/admin')) {
    return role === 'admin';
  }
  
  // Rutas de cliente
  if (route === '/dashboard' || route === '/profile' || route === '/kyc') {
    return role === 'cliente';
  }
  
  // Rutas públicas
  if (route === '/login' || route === '/register' || route === '/unauthorized') {
    return true;
  }
  
  return false;
};