// src/types/dto/imagen.dto.ts
import type { BaseDTO } from "./base.dto";

// ==========================================
// 📥 RESPONSE DTO (Lo que recibes del Backend)
// ==========================================

export interface ImagenDto extends BaseDTO {
  url: string;         // Ej: '/uploads/imagenes/foto-123.jpg'
  descripcion?: string;

  // Relaciones
  id_proyecto: number | null;
  id_lote: number | null;
}

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al Backend)
// ==========================================

/**
 * DTO para SUBIR una imagen (POST).
 * ⚠️ Importante: Esto se convierte a FormData en el servicio.
 */
export interface CreateImagenDto {
  // El archivo físico del input type="file"
  file: File;

  descripcion?: string;

  // Debe enviarse al menos uno de los dos
  id_proyecto?: number | null;
  id_lote?: number | null;
}

/**
 * DTO para ACTUALIZAR datos de una imagen (PUT).
 * Generalmente solo actualizas metadata, no el archivo en sí.
 */
export interface UpdateImagenDto {
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;

  activo?: boolean;
}