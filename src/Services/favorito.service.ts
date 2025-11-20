import type { CheckFavoritoResponseDto, EstadisticasFavoritosResponseDto, ToggleFavoritoRequestDto, ToggleFavoritoResponseDto } from '../types/dto/favorito.dto';
import type { LoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const FavoritoService = {

  // =================================================
  // ❤️ GESTIÓN USUARIO (Mis Favoritos)
  // =================================================

  /**
   * Agrega o quita un lote de favoritos.
   * Endpoint: POST /api/favoritos/toggle (ajusta la ruta base según tu router)
   */
  toggle: async (idLote: number): Promise<AxiosResponse<ToggleFavoritoResponseDto>> => {
    const data: ToggleFavoritoRequestDto = { id_lote: idLote };
    return await httpService.post('/favoritos/toggle', data);
  },

  /**
   * Obtiene la lista de lotes favoritos del usuario actual.
   * El backend devuelve directamente un array de Lotes.
   */
  getMisFavoritos: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get('/favoritos/mis_favoritos');
  },

  /**
   * Verifica si un lote específico es favorito (útil para pintar el corazón en la UI).
   * Endpoint: GET /api/favoritos/check/:id
   */
  checkEsFavorito: async (idLote: number): Promise<AxiosResponse<CheckFavoritoResponseDto>> => {
    return await httpService.get(`/favoritos/check/${idLote}`);
  },

  // =================================================
  // 📊 GESTIÓN ADMINISTRATIVA (Estadísticas)
  // =================================================

  /**
   * Obtiene métricas de favoritos para un proyecto específico.
   * Requiere ID de proyecto obligatorio.
   */
  getEstadisticas: async (idProyecto: number): Promise<AxiosResponse<EstadisticasFavoritosResponseDto>> => {
    return await httpService.get('/favoritos/estadisticas', {
      params: { id_proyecto: idProyecto }
    });
  }
};

export default FavoritoService;