// src/core/types/dto/puja.dto.ts

import type { BaseDTO } from "./base.dto";
import type { LoteDto } from "./lote.dto";
import type { ProyectoDto } from "./proyecto.dto";

// ==========================================
// 🛠️ ENUMS & TYPES
// ==========================================

export type EstadoPuja =
  | 'activa'
  | 'ganadora_pendiente'
  | 'ganadora_pagada'
  | 'perdedora'
  | 'cancelada'
  | 'cubierto_por_puja'
  | 'ganadora_incumplimiento';

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
  id_ganador: number | null;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * DTO completo de Puja.
 * ✅ Sincronizado con los 'includes' del backend: Lote, Proyecto y Usuario.
 */
export interface PujaDto extends BaseDTO {
  monto_puja: number;
  fecha_puja: string; // ISO Date
  estado_puja: EstadoPuja;
  fecha_vencimiento_pago?: string;

  id_proyecto: number;
  id_lote: number;
  id_usuario: number;
  id_transaccion?: number;
  id_suscripcion: number;

  // --- Relaciones Anidadas (Includes) ---

  // El lote donde se realizó la puja
  lote?: LoteDto;

  // El proyecto al que pertenece el lote (alias 'proyectoAsociado' en el back)
  proyectoAsociado?: Partial<ProyectoDto>;

  // Datos del usuario que realizó la puja (útil para el Admin)
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario?: string;
  };

  // Suscripción del usuario al proyecto
  suscripcion?: {
    id: number;
    tokens_disponibles: number;
  };

  //Detalles de solicitud de Rechazo de puja (si aplica)
  solicitud_cancelacion: boolean
  motivo: string | null
}

/**
 * Respuesta del proceso de pago de subasta
 */
export interface PujaCheckoutResponse {
  message: string;
  url_checkout?: string;
  transaccion_id?: number;
  is2FARequired?: boolean;
  pujaId?: number;
}

// ==========================================
// 📊 DTOs AUXILIARES
// ==========================================

/**
 * Para el historial consolidado del usuario
 */
export interface MisPujasDto {
  activas: PujaDto[];
  ganadoras: PujaDto[];
  perdedoras: PujaDto[];
  total: number;
}