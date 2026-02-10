// src/core/types/dto/suscripcion.dto.ts

import type { BaseDTO } from "./base.dto";
import type { ProyectoDto } from "./proyecto.dto";

// ==========================================
// 📤 REQUEST DTOs
// ==========================================

export interface IniciarSuscripcionDto {
  id_proyecto: number;
}

export interface ConfirmarSuscripcion2faDto {
  transaccionId: number;
  codigo_2fa: string;
}

// ==========================================
// 📥 RESPONSE DTOs
// ==========================================

/**
 * Coincide con el modelo Sequelize: SuscripcionProyecto
 */
export interface SuscripcionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  
  // Coincide con `tokens_disponibles` (defaultValue: 1)
  tokens_disponibles: number;

  // Coincide con `meses_a_pagar`
  meses_a_pagar: number;       

  // Coincide con `saldo_a_favor` (DECIMAL)
  saldo_a_favor: number;       

  // ⚠️ ATENCIÓN: En tu modelo SuscripcionProyecto se llama así:
  monto_total_pagado: number;  

  // Asumo que 'activo' viene de tus baseAttributes o es un campo virtual
  activo: boolean;

  // Relaciones (Includes)
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
// 📊 MÉTRICAS
// ==========================================

export interface MorosidadDTO {
  total_pagos_generados: string; 
  total_en_riesgo: string;
  tasa_morosidad: string; 
}

export interface CancelacionDTO {
  total_suscripciones: number;
  total_canceladas: number;
  tasa_cancelacion: string; 
}

// ==========================================
// 🛑 HISTORIAL DE CANCELADAS
// ==========================================

/**
 * Coincide con el modelo Sequelize: SuscripcionCancelada
 */
export interface SuscripcionCanceladaDto extends BaseDTO {
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  
  // Coincide con `meses_pagados`
  meses_pagados: number;

  // ⚠️ ATENCIÓN: En tu modelo SuscripcionCancelada el nombre está invertido respecto al otro:
  monto_pagado_total: number; 

  // Coincide con `fecha_cancelacion`
  fecha_cancelacion: string;

  // Relaciones opcionales
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  proyecto?: {
    nombre_proyecto: string;
  };
}