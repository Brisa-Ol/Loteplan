

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface ToggleFavoritoRequestDto {
  id_lote: number;
}

export interface GetEstadisticasRequestDto {
  id_proyecto: number;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Respuesta al agregar/quitar favorito
 */
export interface ToggleFavoritoResponseDto {
  agregado: boolean; // true = se agregó, false = se eliminó
  mensaje: string;
}

/**
 * Respuesta simple de chequeo
 */
export interface CheckFavoritoResponseDto {
  es_favorito: boolean;
}

// --- ESTADÍSTICAS (ADMIN) ---

/**
 * Estructura de un item en la lista de estadísticas
 */
export interface EstadisticaLoteItemDto {
  lote: LoteDto; // El objeto lote completo
  total_favoritos: number;
}

/**
 * Respuesta completa del endpoint de estadísticas
 */
export interface EstadisticasFavoritosResponseDto {
  proyecto_filtrado: number;
  total_lotes_con_favoritos: number;
  
  // Puede ser null si no hay favoritos aún
  lote_mas_votado: EstadisticaLoteItemDto | null;
  lote_menos_votado: EstadisticaLoteItemDto | null;
  
  // Lista completa para gráficas o tablas
  estadisticas_lotes: EstadisticaLoteItemDto[];
}