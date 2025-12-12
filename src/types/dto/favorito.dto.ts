import { type BaseDTO } from './base.dto';
import type { LoteDto } from './lote.dto';

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
  favorito: boolean;
  mensaje: string;
}

export interface CheckFavoritoResponseDto {
  es_favorito: boolean;
}

// 📦 Estructura cruda que devuelve tu Backend actual
// (Nota: El backend devuelve 'estadisticas_lotes' anidado)
export interface BackendEstadisticasResponse {
  proyecto_filtrado: number;
  total_lotes_con_favoritos: number;
  lote_mas_votado: any;
  lote_menos_votado: any;
  estadisticas_lotes: Array<{
    lote: LoteDto; // Objeto lote completo anidado
    total_favoritos: number;
  }>;
}

// 📊 Estructura limpia y plana para el Frontend (Gráficos y Tablas)
export interface PopularidadLoteDTO {
  id_lote: number;
  nombre_lote: string;
  cantidad_favoritos: number;
  porcentaje_popularidad: number; // Calculado en el frontend
  precio_base: number;
}

export interface EstadisticasFavoritosResponseDto {
  // Interfaz base por si se agregan más métricas generales
  total_global?: number;
}