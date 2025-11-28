import type { 
  CheckFavoritoResponseDto, 
  ToggleFavoritoRequestDto, 
  ToggleFavoritoResponseDto,
  PopularidadLoteDTO,
  BackendEstadisticasResponse
} from '../types/dto/favorito.dto';
import type { LoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const FavoritoService = {

  // =================================================
  // ❤️ GESTIÓN USUARIO (Mis Favoritos)
  // =================================================

  /**
   * Agrega o quita un lote de favoritos.
   * Endpoint: POST /favoritos/toggle
   */
  toggle: async (idLote: number): Promise<AxiosResponse<ToggleFavoritoResponseDto>> => {
    const data: ToggleFavoritoRequestDto = { id_lote: idLote };
    return await httpService.post('/favoritos/toggle', data);
  },

  /**
   * Obtiene la lista de lotes favoritos del usuario actual.
   * GET /favoritos/mis_favoritos
   */
  getMisFavoritos: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get('/favoritos/mis_favoritos');
  },

  /**
   * Verifica si un lote específico es favorito.
   * GET /favoritos/check/:id
   */
  checkEsFavorito: async (idLote: number): Promise<AxiosResponse<CheckFavoritoResponseDto>> => {
    return await httpService.get(`/favoritos/check/${idLote}`);
  },

  // =================================================
  // 📊 ADAPTADOR DE ESTADÍSTICAS (Front -> Back)
  // =================================================

  /**
   * Obtiene la popularidad de lotes.
   * * ⚠️ NOTA DE ADAPTACIÓN:
   * El backend actual (/favoritos/estadisticas) es estricto y requiere 'id_proyecto'.
   * Además, devuelve una estructura anidada { estadisticas_lotes: [{ lote: {...}, total_favoritos: N }] }.
   * * Este método actúa como adaptador:
   * 1. Valida si hay idProyecto (si no, devuelve vacío para evitar error 400).
   * 2. Llama al backend.
   * 3. Calcula el porcentaje de popularidad manualmente (el backend no lo envía).
   * 4. Aplana la respuesta para que el Dashboard la pueda usar fácilmente.
   */
  getPopularidadLotes: async (idProyecto?: number): Promise<PopularidadLoteDTO[]> => {
    try {
      // Validación preventiva: Si no hay ID, el backend fallará.
      if (!idProyecto) {
         console.warn("FavoritoService: Backend requiere id_proyecto para estadísticas. Retornando array vacío.");
         return []; 
      }

      // Llamada al endpoint existente
      const { data } = await httpService.get<BackendEstadisticasResponse>('/favoritos/estadisticas', { 
        params: { id_proyecto: idProyecto } 
      });

      // Extraer array crudo
      const rawStats = data.estadisticas_lotes || [];

      // 1. Calcular total global de votos en este set para poder sacar porcentajes relativos
      const totalVotos = rawStats.reduce((acc, item) => acc + item.total_favoritos, 0);

      // 2. Transformar (Map) y Aplanar
      const mappedStats: PopularidadLoteDTO[] = rawStats.map(item => ({
        id_lote: item.lote.id,
        nombre_lote: item.lote.nombre_lote,
        cantidad_favoritos: item.total_favoritos,
        precio_base: item.lote.precio_base,
        
        // Cálculo matemático del porcentaje en el frontend
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((item.total_favoritos / totalVotos) * 100) 
          : 0
      }));

      // 3. Ordenar descendente (Más populares primero)
      return mappedStats.sort((a, b) => b.cantidad_favoritos - a.cantidad_favoritos);

    } catch (error) {
      console.error("Error en adaptador getPopularidadLotes:", error);
      // Retornar array vacío en caso de error para que la UI no rompa
      return []; 
    }
  }
};

export default FavoritoService;