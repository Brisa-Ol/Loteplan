// src/types/dto/favorito.dto.ts
import type { LoteDTO } from './lote.dto'; // Importamos LoteDTO porque es lo que devolvemos

/**
 * ❗ DTO DE SALIDA (Básico)
 * Representa el registro de la tabla 'favorito'.
 * Nota: Raramente se envía solo. Normalmente se incluye el Lote.
 */
export interface FavoritoDTO {
  id: number;
  id_usuario: number;
  id_lote: number;
  fecha_creacion?: string; // Nombre de timestamp personalizado
  fecha_actualizacion?: string; // Nombre de timestamp personalizado
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para marcar/desmarcar un favorito.
 * En realidad, solo se necesita el ID del lote en la URL.
 */
// No se necesita un DTO de entrada, el idLote va en la URL.

/**
 * ❗ DTO DE SALIDA (NUEVO)
 * Respuesta que el backend envía tras llamar a 'toggleFavorito'.
 */
export interface ToggleFavoritoResponseDTO {
  agregado: boolean; // true si se agregó, false si se eliminó
  mensaje: string;
}

/**
 * ❗ DTO DE SALIDA (NUEVO)
 * Estructura para la respuesta de 'getEstadisticasFavoritos'.
 */
export interface EstadisticasFavoritoDTO {
  lote: Partial<LoteDTO> & { id: number }; // Incluye solo los campos necesarios del lote
  total_favoritos: number;
}

/**
 * ❗ DTO DE SALIDA (NUEVO)
 * Respuesta que el backend envía tras llamar a 'isFavorito'.
 */
export interface IsFavoritoResponseDTO {
  esFavorito: boolean;
}