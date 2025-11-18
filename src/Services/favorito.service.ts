import httpService from './httpService';

import type { LoteDTO } from '../types/dto/lote.dto';
import type {
  ToggleFavoritoResponseDTO,
  EstadisticasFavoritoDTO,
  IsFavoritoResponseDTO
} from '../types/dto/favorito.dto';

const ENDPOINT = '/favoritos';

/**
 * Agrega o elimina un lote de los favoritos del usuario logueado.
 * Llama a: POST /api/favoritos/toggle/:idLote
 */
export const toggleFavorito = (idLote: number): Promise<ToggleFavoritoResponseDTO> => {
  return httpService.post(`${ENDPOINT}/toggle/${idLote}`);
};

/**
 * Obtiene la lista de lotes favoritos (activos) del usuario logueado.
 * Llama a: GET /api/favoritos/mis-favoritos
 */
export const getMisFavoritos = (): Promise<LoteDTO[]> => {
  return httpService.get(`${ENDPOINT}/mis-favoritos`);
};

/**
 * Verifica si un lote específico es favorito del usuario logueado.
 * Llama a: GET /api/favoritos/status/:idLote
 */
export const isFavorito = (idLote: number): Promise<IsFavoritoResponseDTO> => {
  return httpService.get(`${ENDPOINT}/status/${idLote}`);
};

/**
 * (Admin) Obtiene estadísticas de cuántos usuarios marcaron cada lote como favorito.
 * Llama a: GET /api/favorito/estadisticas?id_proyecto={id}
 */
export const getEstadisticasFavoritos = (idProyecto?: number): Promise<EstadisticasFavoritoDTO[]> => {
  const params = idProyecto ? { params: { id_proyecto: idProyecto } } : {};
  return httpService.get(`${ENDPOINT}/estadisticas`, params);
};