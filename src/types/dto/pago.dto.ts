// src/types/dto/pago.dto.ts (CORREGIDO)
import type { BaseDTO } from './base.dto';
import type { SuscripcionProyectoDTO } from './suscripcionProyecto.dto';
import type { ProyectoDTO } from './proyecto.dto';
import type { UsuarioDTO } from './usuario.dto';
import type { IniciarCheckoutResponseDTO } from './transaccion.dto';

export type PagoEstado = 
  | 'pendiente'
  | 'pagado'
  | 'vencido'
  | 'cancelado'
  | 'cubierto_por_puja';

/**
 * DTO DE SALIDA (para recibir pagos desde el backend)
 */
export interface PagoDTO extends BaseDTO {
  id_suscripcion: number | null;
  id_usuario: number | null;
  id_proyecto: number | null;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado_pago: PagoEstado;
  mes: number;
  suscripcion?: SuscripcionProyectoDTO & {
    proyectoAsociado?: ProyectoDTO;
    usuario?: UsuarioDTO;
  };
}

/**
 * DTO DE ENTRADA (para pagar una cuota YA EXISTENTE)
 */
export interface CreatePaymentOrderDTO {
  pagoId: number; 
}

/**
 * DTO DE SALIDA (respuesta al pedir checkout)
 */
export interface CreatePaymentOrderResponseDTO {
  preferenceId: string;
  redirectUrl: string; // <-- Asegúrate que tu servicio `iniciarCheckout` devuelva esto
}
export { type IniciarCheckoutResponseDTO }; // 👈 Re-exportar
/**
 * DTO DE ENTRADA (para crear la CUOTA 1)
 */
export interface CreatePagoInicialDTO {
  id_proyecto: number;
}

/**
 * 🔴 ADMIN: Métricas de recaudo mensual
 */
export interface MetricasRecaudoMensualDto {
  mes: number;
  anio: number;
  recaudo_total: number;
  monto_vencido: number;
  total_pagos: number;
  pagos_pendientes: number;
}

/**
 * 🔴 ADMIN: Tasa de pagos a tiempo
 */
export interface TasaPagosATiempoDto {
  mes: number;
  anio: number;
  tasa_pagos_a_tiempo: string; // porcentaje como string
  total_pagos: number;
  pagos_a_tiempo: number;
}