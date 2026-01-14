// src/types/dto/suscripcion.dto.ts
import type { BaseDTO } from "./base.dto";
import type { ProyectoDto } from "./proyecto.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al Back)
// ==========================================

export interface IniciarSuscripcionDto {
  id_proyecto: number;
  // Agrega otros campos si tu backend los requiere en el body inicial
}

export interface ConfirmarSuscripcion2faDto {
  transaccionId: number;
  codigo_2fa: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes del Back)
// ==========================================

/**
 * Modelo principal de Suscripción (SuscripcionProyecto)
 */
export interface SuscripcionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  
  // Campos específicos de tu modelo Sequelize
  tokens_disponibles: number;
  meses_a_pagar: number;       // Nuevo campo que agregaste
  saldo_a_favor: number;       // Nuevo campo que agregaste
  monto_total_pagado: number;  // Nuevo campo que agregaste
  activo: boolean;

  // Relaciones (Include)
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario: string;
  };
  
  proyectoAsociado?: ProyectoDto;
}

export interface SuscripcionInitResponse {
  message: string;
  redirectUrl?: string;
  transaccionId?: number;
  is2FARequired?: boolean;
}

// ==========================================
// 📊 MÉTRICAS (ADMIN - KPIs)
// Coinciden con el return de tu controller
// ==========================================

export interface MorosidadDTO {
  // Tu backend devuelve .toFixed(2), por lo tanto son strings
  total_pagos_generados: string; 
  total_en_riesgo: string;
  tasa_morosidad: string; 
}

export interface CancelacionDTO {
  total_suscripciones: number;
  total_canceladas: number;
  tasa_cancelacion: string; // Tu backend devuelve .toFixed(2) -> string
}

// ==========================================
// 🛑 HISTORIAL DE CANCELADAS
// ==========================================

export interface SuscripcionCanceladaDto extends BaseDTO {
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;
  monto_pagado_total: number;
  fecha_cancelacion: string;

  // Relaciones opcionales para mostrar nombres en tabla
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  proyecto?: {
    nombre_proyecto: string;
  };
}