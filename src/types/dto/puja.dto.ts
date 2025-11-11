// src/types/dto/puja.dto.ts
import type { BaseDTO } from './base.dto';
import type { LoteDTO } from './lote.dto';             // <-- Importar LoteDTO
import type { TransaccionDTO } from './transaccion.dto'; // <-- Importar TransaccionDTO

/**
 * Define los estados posibles para una puja.
 * (Este tipo ya lo teníamos).
 */
export type PujaEstado =
  | 'activa'
  | 'ganadora_pendiente'
  | 'ganadora_pagada'
  | 'perdedora'
  | 'cancelada'
  | 'cubierto_por_puja'
  | 'ganadora_incumplimiento';

/**
 * ❗ DTO DE SALIDA (ACTUALIZADO)
 * Representa una puja que RECIBIMOS del backend.
 * Ahora incluye el Lote opcionalmente.
 */
export interface PujaDTO extends BaseDTO {
  monto_puja: number;
  fecha_puja: string | null;
  id_lote: number;
  id_usuario: number;
  id_transaccion: number | null;
  estado_puja: PujaEstado;
  fecha_vencimiento_pago: string | null;
  id_suscripcion: number;

  /**
   * ❗ Campo Opcional del 'include'
   * El Lote asociado a la puja. Es opcional (?)
   * porque no todas las consultas lo incluirán.
   */
  lote?: LoteDTO;
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para crear o actualizar una puja.
 * (Basado en la función 'create' de tu backend).
 */
export interface CreatePujaDTO {
  id_lote: number;
  monto_puja: number;
  // 'id_usuario' lo pone el backend (del token)
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para iniciar el checkout de una puja ganadora.
 * (Basado en la función 'requestCheckoutForPuja').
 */
// No necesitamos un DTO específico, solo se envía el pujaId en la URL.

/**
 * ❗ DTO DE SALIDA (NUEVO)
 * Respuesta que el backend envía tras solicitar el checkout de una puja.
 * (Basado en la función 'requestCheckoutForPuja').
 */
export interface RequestCheckoutPujaResponseDTO {
  transaccion: TransaccionDTO; // La transacción creada para este intento de pago
  checkoutUrl: string;       // La URL de Mercado Pago para redirigir
}