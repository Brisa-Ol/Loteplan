// src/types/dto/favorito.dto.ts

// ==========================================
// 📤 REQUEST DTOs
// ==========================================

export interface ToggleFavoritoRequestDto {
  id_lote: number;
}

// ==========================================
// 📥 RESPONSE DTOs
// ==========================================

export interface ToggleFavoritoResponseDto {
  agregado: boolean; // ⚠️ CORREGIDO: Backend devuelve 'agregado', no 'favorito'
  mensaje: string;
}

export interface CheckFavoritoResponseDto {
  es_favorito: boolean;
}

// Sub-interfaz para el objeto parcial de lote que viene en estadísticas
// (El backend en 'getEstadisticasFavoritos' solo devuelve estos campos específicos)
export interface LoteEstadisticaBackend {
  id: number;
  nombre_lote: string;
  estado_subasta: string;
  precio_base: number;
  id_proyecto: number;
  imagenes: any[]; // Viene vacío desde el backend en este endpoint
}

// 📦 Estructura cruda que devuelve tu Backend
export interface BackendEstadisticasResponse {
  proyecto_filtrado: number;
  total_lotes_con_favoritos: number;
  lote_mas_votado: { lote: LoteEstadisticaBackend; total_favoritos: number } | null;
  lote_menos_votado: { lote: LoteEstadisticaBackend; total_favoritos: number } | null;
  estadisticas_lotes: Array<{
    lote: LoteEstadisticaBackend;
    total_favoritos: number;
  }>;
}

// 📊 Estructura limpia y plana para el Frontend (Para usar en Gráficos/Tablas)
export interface PopularidadLoteDTO {
  id_lote: number;
  nombre_lote: string;
  cantidad_favoritos: number;
  porcentaje_popularidad: number; // Calculado en el frontend
  precio_base: number;
}