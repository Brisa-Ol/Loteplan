
import type { BaseDTO } from "./base.dto";
import type { LoteDto } from "./lote.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

/**
 * DTO para crear una nueva puja.
 * Backend: puja.controller.js -> create()
 */

export interface CreatePujaDto {
  id_lote: number;
  monto_puja: number;
  id_suscripcion?: number;
}
/**
 * DTO para confirmar pago con 2FA.
 * Backend: puja.controller.js -> confirmarPujaCon2FA()
 */
export interface ConfirmarPuja2faDto {
  pujaId: number;
  codigo_2fa: string;
}
/**
 * DTO para gestión manual de fin de subasta (Admin).
 * Backend: puja.controller.js -> manageAuctionEnd()
 */
export interface ManageAuctionEndDto {
  id_lote: number;
  id_ganador: number;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

export type EstadoPuja = 
  | 'activa' 
  | 'ganadora_pendiente' 
  | 'ganadora_pagada' 
  | 'perdedora' 
  | 'cancelada' 
  | 'cubierto_por_puja' 
  | 'ganadora_incumplimiento';
/**
 * DTO completo de Puja según el modelo del backend.
 * Backend: models/Puja.js
 */
export interface PujaDto extends BaseDTO {
  monto_puja: number;
  fecha_puja: string; // ISO Date
  
  estado_puja: EstadoPuja;
  fecha_vencimiento_pago?: string; // ISO Date (Solo si es ganadora_pendiente)
  
  id_lote: number;
  id_usuario: number;
  id_transaccion?: number;
  id_suscripcion: number;

  // Relaciones opcionales (depende del include del backend)
  lote?: LoteDto;
}

/**
 * Respuesta al intentar iniciar el pago de una puja ganadora.
 * Backend: puja.controller.js -> requestCheckout() y confirmarPujaCon2FA()
 */
export interface PujaCheckoutResponse {
  message: string;
  
  // Caso A: Redirección directa
  url_checkout?: string; // Nota: En tu controller de puja se llama 'url_checkout'
  transaccion_id?: number;
  
  // Caso B: Requiere 2FA
  is2FARequired?: boolean;
  pujaId?: number;
}
export interface ManageAuctionEndResponse {
  message: string;
}

// ==========================================
// 📊 DTOs AUXILIARES (Opcionales, para vistas específicas)
// ==========================================

/**
 * DTO simplificado para mostrar resumen de pujas en tablas.
 */
export interface PujaResumenDto {
  id: number;
  monto_puja: number;
  fecha_puja: string;
  estado_puja: EstadoPuja;
  id_usuario: number;
  nombre_lote?: string; // Si incluyes el lote
}

/**
 * DTO para mostrar el historial de un usuario.
 */
export interface MisPujasDto {
  activas: PujaDto[];
  ganadoras: PujaDto[];
  perdedoras: PujaDto[];
  total: number;
}