// src/services/favorito.service.ts
import type { 
  CheckFavoritoResponseDto, 
  ToggleFavoritoRequestDto, 
  ToggleFavoritoResponseDto,
  PopularidadLoteDTO,
  BackendEstadisticasResponse
} from '../types/dto/favorito.dto';
import type { LoteDto } from '../types/dto/lote.dto'; // Asumo que tienes este archivo
import httpService from './httpService';
import type { AxiosResponse } from 'axios';
/**
 * Servicio para la gestión de favoritos (lotes guardados).
 * Conecta con el controlador `favoritoController` del backend.
 *  @remarks
 * - Los favoritos permiten a los usuarios guardar lotes de interés
 * - Los lotes privados (con proyecto) requieren suscripción activa
 * - Los lotes públicos pueden ser favoritos sin restricciones
 * - El backend valida permisos antes de agregar favoritos
 */
const FavoritoService = {
  // =================================================
  // ❤️ GESTIÓN USUARIO (Mis Favoritos)
  // =================================================

  /**
   * Agrega o quita un lote de favoritos (Toggle).
   * @param idLote - ID del lote a agregar/quitar
   * @returns Respuesta indicando si fue agregado o removido
   */
  toggle: async (idLote: number): Promise<AxiosResponse<ToggleFavoritoResponseDto>> => {
    const data: ToggleFavoritoRequestDto = { id_lote: idLote };
    return await httpService.post<ToggleFavoritoResponseDto>('/favoritos/toggle', data);
  },

  /**
   * Obtiene la lista de lotes favoritos del usuario actual.
   * @returns Lista de lotes favoritos
   * @remarks
   * Backend: GET /api/favoritos/mis-favoritos
   * - Requiere autenticación
   * - Retorna solo lotes activos
   * - Incluye información completa de cada lote
   */
  getMisFavoritos: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get<LoteDto[]>('/favoritos/mis-favoritos');
  },

  /**
   * Verifica si un lote específico es favorito del usuario.
   * @param idLote - ID del lote a verificar
   * @returns Respuesta con estado de favorito
   */
  checkEsFavorito: async (idLote: number): Promise<AxiosResponse<CheckFavoritoResponseDto>> => {
    return await httpService.get<CheckFavoritoResponseDto>(`/favoritos/check/${idLote}`);
  },

  // =================================================
  // 📊 ESTADÍSTICAS (Admin)
  // =================================================

  /**
   * Obtiene estadísticas de popularidad de lotes por proyecto.
   */
  getPopularidadLotes: async (idProyecto?: number): Promise<PopularidadLoteDTO[]> => {
    try {
      // 1. Validación: El backend exige id_proyecto
      if (!idProyecto) {
        console.warn("FavoritoService: Se requiere id_proyecto para obtener estadísticas.");
        return []; 
      }

      // 2. Llamada al endpoint
      const { data } = await httpService.get<BackendEstadisticasResponse>(
        '/favoritos/estadisticas', 
        { params: { id_proyecto: idProyecto } }
      );

      // 3. Extracción de datos (Protección contra arrays nulos o indefinidos)
      const rawStats = data.estadisticas_lotes || [];

      // 4. Cálculo de totales para porcentaje
      const totalVotos = rawStats.reduce((acc, item) => acc + item.total_favoritos, 0);

      // 5. Mapeo a estructura plana para la UI
      const mappedStats: PopularidadLoteDTO[] = rawStats.map(item => ({
        id_lote: item.lote.id,
        nombre_lote: item.lote.nombre_lote,
        cantidad_favoritos: item.total_favoritos,
        precio_base: item.lote.precio_base,
        // Calculo de porcentaje (evitando división por cero)
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((item.total_favoritos / totalVotos) * 100) 
          : 0
      }));

      // 6. Ordenar: Más populares arriba
      return mappedStats.sort((a, b) => b.cantidad_favoritos - a.cantidad_favoritos);

    } catch (error) {
      console.error("Error en getPopularidadLotes:", error);
      return []; 
    }
  },

  // =================================================
  // 🔧 HELPERS FRONTEND (Lógica de negocio UI)
  // =================================================

  /**
   * Pre-validación en frontend para deshabilitar botones o mostrar tooltips.
   * Replica la lógica de `favoritoService.js` del backend para UX inmediata.
   */
  puedeAgregarFavorito(lote: LoteDto, tieneSuscripcionActiva: boolean): { 
    puede: boolean; 
    razon?: string 
  } {
    if (!lote.activo) {
      return { puede: false, razon: 'El lote no está activo.' };
    }

    // Si tiene id_proyecto, es un lote privado -> Requiere suscripción
    if (lote.id_proyecto && !tieneSuscripcionActiva) {
      return { 
        puede: false, 
        razon: 'Este es un lote exclusivo. Necesitas una suscripción activa al proyecto.' 
      };
    }

    return { puede: true };
  },

  /**
   * Helper visual para precios
   */
  formatPrecio(precio: number): string {
    if (precio === undefined || precio === null) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  }
};

export default FavoritoService;