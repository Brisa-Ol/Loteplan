// src/types/dto/imagen.dto.ts
import type { BaseDTO } from './base.dto';

export interface ImagenDTO extends BaseDTO {
  url: string;
  descripcion?: string | null;
  id_proyecto?: number | null;
  id_lote?: number | null;
}

// DTO para crear una imagen (el archivo se envía por FormData)
export interface CreateImagenDTO {
  descripcion?: string;
  id_proyecto?: number;
  id_lote?: number;
}