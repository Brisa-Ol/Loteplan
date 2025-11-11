// src/types/dto/transaccion.dto.ts
import type { BaseDTO } from './base.dto';
import type { PagoMercadoDTO } from './pagoMercado.dto'; // <-- Importar DTO de MP

/**
 * Define los estados posibles para una transacción.
 * (Este tipo ya lo teníamos).
 */
export type TransaccionEstado =
  | 'pendiente'
  | 'pagado'
  | 'fallido'
  | 'reembolsado'
  | 'expirado'
  | 'rechazado_proyecto_cerrado'
  | 'rechazado_por_capacidad'
  | 'en_proceso'
  | 'revertido'; // Añadir si usas 'revertido'

/**
 * ❗ DTO DE SALIDA (ACTUALIZADO)
 * Representa una transacción que RECIBIMOS del backend.
 * Puede incluir opcionalmente detalles del pago en la pasarela.
 */
export interface TransaccionDTO extends BaseDTO {
  tipo_transaccion: string; // 'directo', 'Puja', 'pago_suscripcion_inicial', 'mensual'
  monto: number;
  fecha_transaccion: string | null;
  id_usuario: number;
  id_proyecto: number | null;
  id_pago_mensual: number | null;
  id_pago_pasarela: number | null;
  id_inversion: number | null;
  id_puja: number | null;
  id_suscripcion: number | null; // Añadido basado en el servicio
  estado_transaccion: TransaccionEstado;
  error_detalle?: string | null; // Añadido basado en el servicio

  /**
   * ❗ Campo Opcional del 'include' (si el backend lo envía)
   * Detalles del pago realizado a través de Mercado Pago.
   */
  pago_pasarela?: PagoMercadoDTO;
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para iniciar el proceso de checkout.
 * (Basado en la función 'iniciarTransaccionYCheckout').
 */
export interface IniciarCheckoutDTO {
  /** El tipo de entidad que se está pagando */
  modelo: 'inversion' | 'pago' | 'puja';
  /** El ID de la Inversion, Pago (cuota) o Puja */
  modeloId: number;
}

/**
 * ❗ DTO DE SALIDA (NUEVO)
 * Respuesta que el backend envía tras iniciar el checkout.
 */
export interface IniciarCheckoutResponseDTO {
  success: boolean;
  message: string;
  transaccionId: number;
  modelo: string;
  modeloId: number;
  redirectUrl: string; // 👈 La URL de Mercado Pago
}