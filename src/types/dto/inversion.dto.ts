
import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================


export interface CreateInversionDto {
  id_proyecto: number;
  // El monto se toma del proyecto en el backend para inversiones directas,
  // pero si en el futuro hay monto variable, se agregaría aquí.
}

export interface ConfirmarPago2faDto {
  inversionId: number;
  codigo_2fa: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo de Inversión Base
 */
export interface InversionDto extends BaseDTO {
  monto: number;
  fecha_inversion: string; // ISO Date
  estado: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';
  
  id_usuario: number;
  id_proyecto: number;
  
  // Relaciones opcionales (si el backend las incluye en queries específicas)
  proyecto?: {
    nombre_proyecto: string;
    // ... otros datos del proyecto
  };
}

/**
 * Respuesta tras crear la inversión (Paso 1)
 */
export interface CreateInversionResponse {
  message: string;
  inversionId: number;
  url_pago_sugerida: string;
}

/**
 * Respuesta del intento de Checkout.
 * Puede indicar redirección inmediata O requerimiento de 2FA.
 */
export interface CheckoutResponse {
  message: string;
  
  // Caso A: Redirección directa (Sin 2FA o ya verificado)
  redirectUrl?: string;
  transaccionId?: number;
  
  // Caso B: Se requiere 2FA (Status 202)
  is2FARequired?: boolean;
  inversionId?: number;
}

// ==========================================
// 📊 MÉTRICAS (ADMIN)
// ==========================================

export interface LiquidityMetricDto {
  total_invertido_registrado: number;
  total_pagado: number;
  tasa_liquidez: number; // Porcentaje
}

export interface AggregatedUserMetricDto {
  id_usuario: number;
  monto_total_invertido: number;
  // Podrías necesitar un join con usuarios para mostrar el nombre
}