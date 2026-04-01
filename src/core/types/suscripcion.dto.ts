import type { BaseDTO } from "./base.dto";

// --- DTOs de Entrada (Payloads) ---
export interface IniciarSuscripcionDto {
  id_proyecto: number;
  tokens_a_suscribir?: number;
}

export interface ConfirmarSuscripcion2faDto {
  id_proyecto?: number;
  transaccionId: number,
  codigo_2fa: string;
}

// --- DTOs de Salida (Respuestas) ---
export interface SuscripcionInitResponse {
  requiere2FA: boolean;
  checkoutUrl?: string;
  mensaje?: string;
  transaccionId: number
}

export interface MorosidadDTO {
  tasa_morosidad: number;
  total_pagos_generados: number;
  total_en_riesgo: number;
}

export interface CancelacionDTO {
  tasa_cancelacion: number;
  total_canceladas: number;
  total_suscripciones: number; // ❌ faltaba este campo

}

export interface SuscripcionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  activo: boolean;
  tokens_disponibles: number;
  meses_a_pagar: number;
  saldo_a_favor: string;
  monto_total_pagado: string;
  createdAt: string;
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
    tipo_inversion: string;
    estado_proyecto: string;
    plazo_inversion: number;
    obj_suscripciones: number;
    suscripciones_actuales: number;
  };
}

export interface ProyectoDirectoDTO {
    id: number,
    nombre_proyecto: string
}

export interface SuscripcionCanceladaDto extends BaseDTO {
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;
  monto_pagado_total: string;
  fecha_cancelacion: string;
  devolucion_realizada: boolean; // <-- NUEVO
  fecha_devolucion: string | null; // <-- NUEVO
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