

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

import type { BaseDTO } from "./base.dto";

/**
 * Datos para subir una nueva imagen.
 * Se transforma a FormData en el servicio.
 * ⚠️ Regla de Negocio: Solo id_proyecto O id_lote, no ambos.
 */
export interface CreateImagenDto {
  file: File; // Se enviará como 'image'
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;
}

/**
 * Datos para actualizar metadatos de la imagen.
 * No incluye el archivo, ya que tu controlador 'update' solo actualiza campos de BD.
 */
export interface UpdateImagenDto {
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;
  activo?: boolean;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo de Imagen que viene de la Base de Datos.
 */
export interface ImagenDto extends BaseDTO {
  url: string; // Ruta relativa ej: '/uploads/imagenes/foto-123.jpg'
  descripcion?: string;
  
  id_proyecto: number | null;
  id_lote: number | null;
}