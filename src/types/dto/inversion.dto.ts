// src/types/dto/inversion.dto.ts
import type { BaseDTO } from './base.dto';

/**
 * Define los estados posibles para una inversión.
 * (Esta es la interfaz que ya habíamos definido).
 */
export type InversionEstado = 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';

/**
 * ❗ DTO DE SALIDA (El que ya teníamos)
 * Representa los datos de una inversión que RECIBIMOS del backend.
 */
export interface InversionDTO extends BaseDTO {
  monto: number;
  fecha_inversion: string | null;
  estado: InversionEstado;
  id_usuario: number;
  id_proyecto: number;
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para INICIAR una inversión directa.
 *
 * Basado en tu 'inversionService.js', el frontend solo necesita
 * enviar el ID del proyecto.
 *
 * El 'id_usuario' lo toma el backend del token (req.user).
 * El 'monto' lo toma el backend del modelo del Proyecto.
 */
export interface CreateInversionDTO {
  id_proyecto: number;
}
export interface InversionCreadaResponseDTO {
  message: string;
  inversionId: number;
  modelo: string;
  url_pago_sugerida: string; // ej: "/api/inversion/iniciar-pago/1"
}

/**
 * 🔴 ADMIN: Métricas de liquidez
 */
export interface MetricasLiquidezDto {
  total_pagado: number;
  total_invertido_registrado: number;
  tasa_liquidez: string; // porcentaje como string
}

/**
 * 🔴 ADMIN: Inversión agregada por usuario
 */
export interface InversionAgregadaPorUsuarioDto {
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  monto_total_invertido: number;
}