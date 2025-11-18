// Archivo: src/types/puja.dto.ts

// (Asumo que ya tienes estas interfaces de respuestas anteriores)
// Archivo: src/types/puja.dto.ts
// (Asumo que ya tienes estas interfaces de respuestas anteriores)
import type { ILote } from './lote.dto';
import type { ISuscripcionProyecto } from './suscripcionProyecto.dto';

/**
 * Define los estados posibles de una puja, basado en tu ENUM de Sequelize.
 */
export type PujaEstado = 
  | "activa"
  | "ganadora_pendiente"
  | "ganadora_pagada"
  | "perdedora"
  | "cancelada"
  | "cubierto_por_puja"
  | "ganadora_incumplimiento";

/**
 * Interfaz principal basada en tu modelo Sequelize 'Puja'.
 */
export interface IPuja {
  id: number;
  monto_puja: string; // DECIMAL
  fecha_puja: string; // DATE
  id_lote: number;
  id_usuario: number;
  id_transaccion: number | null;
  estado_puja: PujaEstado;
  fecha_vencimiento_pago: string | null;
  id_suscripcion: number;
  
  // Tu servicio de backend (pujaService) usa 'activo: true' en muchas
  // búsquedas (ej. findMyPujas), así que 'activo' debe venir de 'baseAttributes'.
  activo: boolean; 
  
  createdAt: string;
  updatedAt: string;

  // Relaciones opcionales que tu servicio de backend incluye
  lote?: ILote;
  suscripcion?: ISuscripcionProyecto;
}

/**
 * DTO para crear una nueva puja.
 * (POST /)
 */
export interface PujaCreateDTO {
  id_lote: number;
  monto_puja: string; // Enviar como string para precisión
}

/**
 * DTO para actualizar una puja (Admin).
 * (PUT /:id)
 */
export type PujaUpdateDTO = Partial<{
  monto_puja: string;
  estado_puja: PujaEstado;
  // ... otros campos que el admin pueda modificar
}>;


// --- DTOs del Flujo de Pago 2FA ---

/**
 * Respuesta del primer paso del pago (POST /iniciar-pago/:id).
 * Puede ser una solicitud de 2FA (202) o una URL de checkout directa (200).
 */
export interface RequestCheckoutResponse {
  message: string;
  // Si es 202 (2FA Requerido)
  is2FARequired?: boolean;
  pujaId?: number;
  // Si es 200 (Flujo normal)
  transaccion_id?: number;
  url_checkout?: string;
}

/**
 * DTO para el segundo paso del pago (si 2FA fue requerido).
 * (POST /confirmar-2fa)
 */
export interface PujaConfirm2FADTO {
  pujaId: number;
  codigo_2fa: string;
}

/**
 * Respuesta del segundo paso del pago (si 2FA fue exitoso).
 * (POST /confirmar-2fa)
 */
export interface PujaConfirm2FAResponse {
  message: string;
  transaccion_id: number;
  url_checkout: string;
}

// --- DTOs de Admin ---

/**
 * DTO para gestionar el fin de la subasta (Admin).
 * (POST /gestionar_finalizacion)
 */
export interface PujaManageEndDTO {
  id_lote: number;
  id_ganador: number; // Aunque el servicio no lo usa, el controller lo pide
}

/**
 * Respuesta genérica de mensaje (usada por gestionar_finalizacion).
 */
export interface SimpleMessageResponse {
  message: string;
}