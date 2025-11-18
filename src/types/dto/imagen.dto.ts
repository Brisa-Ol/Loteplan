// src/dto/imagen.dto.ts

/**
 * DTO que representa una Imagen en el sistema
 */
export interface ImagenDTO {
  id: number;
  url: string;
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para crear una nueva imagen
 */
export interface CreateImagenDTO {
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;
}

/**
 * DTO para actualizar una imagen existente
 */
export interface UpdateImagenDTO {
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;
  activo?: boolean;
}

/**
 * DTO para la respuesta de creación de imagen
 */
export interface CreateImagenResponseDTO extends ImagenDTO {}

/**
 * DTO para errores de la API
 */
export interface ImagenErrorDTO {
  error: string;
  message?: string;
}