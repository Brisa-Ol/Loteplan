import type { BaseDTO } from "./base.dto";
import type { ProyectoDto } from "./proyecto.dto";


// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================


/**
 * Datos para iniciar el proceso de suscripción (Paso 1).
 * El backend validará si el usuario ya tiene una o si el proyecto está lleno.
 */
export interface IniciarSuscripcionDto {
  id_proyecto: number;
}

export interface ConfirmarSuscripcion2faDto {
  transaccionId: number;
  codigo_2fa: string;
}

export interface ConfirmarSuscripcionWebhookDto {
  transaccionId: number;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo principal de Suscripción.
 */
export interface SuscripcionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  
  tokens_disponibles: number; // Para subastas
  meses_a_pagar: number;      // Deuda restante en meses
  saldo_a_favor: number;      // Dinero excedente de pujas
  monto_total_pagado: number;
  
  // Relación
  proyectoAsociado?: ProyectoDto;
}

/**
 * Respuesta al iniciar suscripción.
 * Similar a Inversión/Pago (puede pedir 2FA).
 */
export interface SuscripcionInitResponse {
  message: string;
  
  // Caso A: Redirección directa
  redirectUrl?: string;
  transaccionId?: number;
  pagoId?: number;
  
  // Caso B: Requiere 2FA (Status 202)
  is2FARequired?: boolean;
}

// ==========================================
// 📊 MÉTRICAS (ADMIN)
// ==========================================

export interface MorosidadDTO {
  total_generado: string;
  monto_en_riesgo: string;
  tasa_morosidad: string;
  suscripciones_en_riesgo: number;
}

export interface CancelacionDTO {
  total_suscripciones: number;
  total_canceladas: number;
  tasa_cancelacion: string;
}

// ==========================================
// 🛑 SUSCRIPCIONES CANCELADAS
// ==========================================

/**
 * Registro histórico de una cancelación.
 */
export interface SuscripcionCanceladaDto extends BaseDTO {
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  
  meses_pagados: number;
  monto_pagado_total: number;
  fecha_cancelacion: string; // ISO Date
}
