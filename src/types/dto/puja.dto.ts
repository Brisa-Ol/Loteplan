
import type { BaseDTO } from "./base.dto";
import type { LoteDto } from "./lote.dto";
// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================



export interface CreatePujaDto {
  id_lote: number;
  monto_puja: number;
}

export interface ConfirmarPuja2faDto {
  pujaId: number;
  codigo_2fa: string;
}

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
 * Respuesta del intento de Checkout (Puja Ganadora).
 * Misma estructura lógica que Inversiones/Pagos.
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