import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreateInversionDto {
  id_proyecto: number;
  // El monto se toma del proyecto en el backend, 
  // pero si lo envías no rompe nada (aunque el back lo ignore).
  monto?: number;
}

export interface ConfirmInversion2faDto {
  // Ajustado para coincidir con tu controlador backend: 
  // const { inversionId, codigo_2fa } = req.body;
  inversionId?: number;
  transaccionId?: number; // Dejamos ambos por compatibilidad si usas lógica mixta
  codigo_2fa: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo de Inversión Base
 */
export interface InversionDto extends BaseDTO {
  monto: string;
  fecha_inversion: string; // ISO Date
  estado: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';

  createdAt: string;
  updatedAt: string;

  id_usuario: number;
  id_proyecto: number;

  // ✅ ADAPTADO: Marcado como opcional (?) porque el endpoint 
  // /mis_inversiones actual NO devuelve estos datos.
  inversor?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario: string;
  };

  // ✅ Relación Proyecto (Backend: as "proyectoInvertido")
  proyectoInvertido?: {
    id: number;
    nombre_proyecto: string;
    tipo_inversion: string;
    estado_proyecto: string;
    monto_inversion: string;
  };
}

/**
 * Respuesta del intento de Checkout.
 */
export interface InversionInitResponse {
  message: string;

  // Caso A: Redirección directa
  redirectUrl?: string;
  transaccionId?: number;

  // Caso B: Se requiere 2FA (Status 202)
  is2FARequired?: boolean;
  inversionId?: number; // El backend devuelve esto en el 202
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
  nombre_usuario: string; // Puede venir null si el include no está configurado en metricas
  email: string;
  monto_total_invertido: string;
  cantidad_inversiones: number;
}