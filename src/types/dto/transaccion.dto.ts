import type { BaseDTO } from "./base.dto";
// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================



/**
 * Datos para crear una transacción manualmente (si fuera necesario).
 * Usualmente el sistema las crea, pero tu controlador expone el endpoint.
 */
export interface CreateTransaccionDto {
  tipo_transaccion: 'inversion' | 'pago' | 'puja' | 'recarga' | 'mensual' | 'directo';
  monto: number;
  id_proyecto?: number;
  id_inversion?: number;
  id_puja?: number;
  id_suscripcion?: number;
  id_pago_mensual?: number;
}

/**
 * Datos para actualizar una transacción (Admin o Usuario propietario).
 */
export interface UpdateTransaccionDto {
  monto?: number;
  estado_transaccion?: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';
  error_detalle?: string;
  // Otros campos editables según tu lógica
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo completo de Transacción.
 */
export interface TransaccionDto extends BaseDTO {
  tipo_transaccion: string;
  monto: number;
  estado_transaccion: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado' | 'expirado' | 'revertido';
  fecha_transaccion?: string; // ISO Date
  error_detalle?: string;
  
  id_usuario: number;
  
  // Referencias cruzadas
  id_proyecto?: number;
  id_inversion?: number;
  id_puja?: number;
  id_suscripcion?: number;
  id_pago_mensual?: number;
  
  // Referencia externa
  id_pago_pasarela?: number;
}

/**
 * Respuesta de confirmación manual (Admin).
 */
export interface ConfirmarTransaccionResponse {
  mensaje: string;
  transaccion: TransaccionDto;
}