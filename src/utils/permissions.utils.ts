import type { UserDto } from "../types/dto/auth.dto";


/**
 * Verifica si un usuario puede realizar transacciones financieras.
 * (Invertir, Pujar, Pagar Suscripción).
 */
export const canPerformFinancialTransaction = (user: UserDto | null): boolean => {
  if (!user) return false; // No logueado
  if (user.rol === 'admin') return false; // ⛔ Bloqueo del middleware
  return true; // Es cliente
};

/**
 * Verifica si el usuario es administrador (para ver paneles de gestión).
 */
export const isAdmin = (user: UserDto | null): boolean => {
  return user?.rol === 'admin';
};