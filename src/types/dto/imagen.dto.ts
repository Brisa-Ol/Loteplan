// src/types/dto/imagen.dto.ts
import type { BaseDTO } from './base.dto';

/**
 * ❗ DTO DE SALIDA 
 * Representa los datos de una imagen que RECIBIMOS del backend.
 */
export interface ImagenDTO extends BaseDTO {
  url: string;
  descripcion: string | null;
  id_proyecto: number | null;
  id_lote: number | null;
}

/**
 * ❗ DTO DE ENTRADA 
 * Datos que el frontend ENVÍA al backend para crear una imagen.
 * (Usado por tu función 'create' del backend).
 */
export interface CreateImagenDTO {
  url: string; 
  descripcion?: string | null;
  id_proyecto?: number | null;
  id_lote?: number | null;
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para actualizar una imagen.
 * (Usado por tu función 'update' del backend).
 */
export type UpdateImagenDTO = Partial<CreateImagenDTO>;