import type { UserDto } from "@/core/types/dto";



/**
 * Verifica si un usuario puede realizar transacciones financieras.
 * (Invertir, Pujar, Pagar Suscripción).
 */
export const canPerformFinancialTransaction = (user: UserDto | null): boolean => {
  return user?.rol === 'cliente';
};
/**
 * Verifica si el usuario es administrador (para ver paneles de gestión).
 */
export const isAdmin = (user: UserDto | null): boolean => {
  return user?.rol === 'admin';
};