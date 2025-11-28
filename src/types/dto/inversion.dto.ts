// src/types/dto/inversion.dto.ts
import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreateInversionDto {
  id_proyecto: number;
  // El monto se toma del proyecto en el backend para inversiones directas,
  // pero si en el futuro hay monto variable, se agregaría aquí.
}

export interface ConfirmInversion2faDto {
  transaccionId: number;
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
 * Respuesta del intento de Checkout.
 * Puede indicar redirección inmediata O requerimiento de 2FA.
 */
export interface InversionInitResponse {
  message: string;
  
  // Caso A: Redirección directa (Sin 2FA o ya verificado)
  redirectUrl?: string;
  transaccionId?: number;
  pagoId?: number;
  
  // Caso B: Se requiere 2FA (Status 202)
  is2FARequired?: boolean;
  inversionId?: number;
}

// ==========================================
// 📊 MÉTRICAS (ADMIN)
// ==========================================

export interface LiquidityRateDTO {
  total_invertido_registrado: string;
  total_pagado: string;
  tasa_liquidez: string;
}

export interface InversionPorUsuarioDTO {
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  monto_total_invertido: string;
  cantidad_inversiones: number;
}