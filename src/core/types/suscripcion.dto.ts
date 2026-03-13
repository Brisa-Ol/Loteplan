import type { BaseDTO } from "./base.dto";

// --- DTOs de Entrada (Payloads) ---
export interface IniciarSuscripcionDto {
  id_proyecto: number;
  tokens_a_suscribir: number;
}

export interface ConfirmarSuscripcion2faDto {
  id_proyecto: number;
  codigo_2fa: string;
}

// --- DTOs de Salida (Respuestas) ---
export interface SuscripcionInitResponse {
  requiere2FA: boolean;
  checkoutUrl?: string; // URL de MercadoPago
  mensaje?: string;
}

export interface MorosidadDTO {
  tasa_morosidad: number;
  total_suscripciones: number;
  suscripciones_en_mora: number;
}

export interface CancelacionDTO {
  tasa_cancelacion: number;
  total_canceladas: number;
  periodo: string;
}

export interface SuscripcionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  tokens_disponibles: number;
  meses_a_pagar: number;
  saldo_a_favor: string; 
  monto_total_pagado: string;
  createdAt: string; // Pisamos el opcional de BaseDTO para que sea obligatorio
  updatedAt: string;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario: string;
  };
  proyectoAsociado?: {
    id: number;
    nombre_proyecto: string;
    estado_proyecto: string;
    plazo_inversion: number;
    obj_suscripciones: number;
    suscripciones_actuales: number;
  };
}

export interface SuscripcionCanceladaDto extends BaseDTO {
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;
  monto_pagado_total: string;
  fecha_cancelacion: string;
  createdAt: string;
  updatedAt: string;
  usuarioCancelador?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  proyectoCancelado?: {
    nombre_proyecto: string;
  };

  suscripcionOriginal?: {
    id: number;
    monto_total_pagado: string;
    activo: boolean;
  };
}