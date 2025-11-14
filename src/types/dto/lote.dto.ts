// src/types/dto/lote.dto.ts

import type { BaseDTO } from './base.dto';
import type { ImagenDTO } from './imagen.dto';

/**
 * Estados posibles de subasta de un lote
 */
export type EstadoSubasta = 'pendiente' | 'activa' | 'finalizada';

/**
 * DTO DE SALIDA - Lote completo
 * (Basado en V1/V2 - Asume que BaseDTO tiene id, activo, fechas)
 */
export interface LoteDTO extends BaseDTO {
  id_proyecto: number | null;
  nombre_lote: string;
  precio_base: number;
  estado_subasta: EstadoSubasta;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  id_puja_mas_alta: number | null;
  id_ganador: number | null;
  intentos_fallidos_pago: number;
  excedente_visualizacion: number;

  // Campos de geolocalización
  latitud: number | null;
  longitud: number | null;

  // Relaciones
  imagenes?: ImagenDTO[];
}

/**
 * DTO DE ENTRADA - Crear Lote
 * (Idéntico en V1 y V2)
 */
export interface CreateLoteDTO {
  id_proyecto?: number | null;
  nombre_lote: string;
  precio_base: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/**
 * DTO DE ENTRADA - Actualizar Lote
 * ❗ CORREGIDO: Incluye los campos de V1 (estado_subasta) y V2 (activo).
 */
export interface UpdateLoteDTO {
  nombre_lote?: string;
  precio_base?: number;
  estado_subasta?: EstadoSubasta; // 👈 Campo clave que faltaba en V2
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id_proyecto?: number | null;
  latitud?: number | null;
  longitud?: number | null;
  activo?: boolean; // 👈 Campo clave que faltaba en V1
  imagenes?: File[];
}

/**
 * DTO para iniciar subasta
 * (De V1 - Necesario para el servicio)
 */
export interface StartAuctionDTO {
  fecha_inicio?: string;
  fecha_fin?: string;
}

/**
 * Respuesta al finalizar subasta
 * (De V1 - Necesario para el servicio)
 */
export interface EndAuctionResponse {
  mensaje: string;
  pujaGanadoraId?: number;
}