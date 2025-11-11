// src/types/dto/lote.dto.ts
import type { ImagenDTO } from './imagen.dto'; // <-- Importante

/**
 * Define los estados posibles para la subasta de un lote.
 * (Este tipo ya lo teníamos).
 */
export type LoteEstadoSubasta = 'pendiente' | 'activa' | 'finalizada';

/**
 * ❗ DTO DE SALIDA (ACTUALIZADO)
 * Representa el lote que RECIBIMOS del backend.
 * Ahora incluye el array de imágenes.
 */
export interface LoteDTO {
  id: number;
  id_proyecto: number | null;
  nombre_lote: string;
  precio_base: number;
  estado_subasta: LoteEstadoSubasta;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean | null;
  id_puja_mas_alta: number | null;
  id_ganador: number | null;
  intentos_fallidos_pago: number;
  excedente_visualizacion: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;

  /**
   * ❗ NUEVO CAMPO (basado en el 'include' de tu backend)
   * Lista de imágenes asociadas a este lote.
   */
  imagenes?: ImagenDTO[];
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el admin ENVÍA para crear un nuevo lote.
 * (Basado en la función 'create' de tu backend).
 */
export interface CreateLoteDTO {
  nombre_lote: string;
  precio_base: number;
  fecha_inicio: string; // "YYYY-MM-DDTHH:mm:ssZ"
  fecha_fin: string;    // "YYYY-MM-DDTHH:mm:ssZ"
  id_proyecto?: number | null;
  // 'estado_subasta' y 'activo' usan los defaults del modelo
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el admin ENVÍA para actualizar un lote.
 * (Basado en la función 'update' de tu backend).
 */
export type UpdateLoteDTO = Partial<CreateLoteDTO & { estado_subasta: LoteEstadoSubasta }>;