// src/services/favorito.service.ts
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
// ✅ Importamos la utilidad para alertas manuales (validaciones de negocio)
import { notifyWarning } from '../utils/snackbarUtils';

const FavoritoService = {
  // =================================================
  // ❤️ GESTIÓN USUARIO (Mis Favoritos)
  // =================================================

  /**
   * Agrega o quita un lote.
   * Sin try/catch: Si falla, el interceptor avisa y React Query recibe el error.
   */
  toggle: async (idLote: number): Promise<AxiosResponse<ToggleFavoritoResponseDto>> => {
    const data: ToggleFavoritoRequestDto = { id_lote: idLote };
    return await httpService.post<ToggleFavoritoResponseDto>('/favoritos/toggle', data);
  },

  getMisFavoritos: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get<LoteDto[]>('/favoritos/mis-favoritos');
  },

  checkEsFavorito: async (idLote: number): Promise<AxiosResponse<CheckFavoritoResponseDto>> => {
    return await httpService.get<CheckFavoritoResponseDto>(`/favoritos/check/${idLote}`);
  },

  // =================================================
  // 📊 ESTADÍSTICAS (Admin)
  // =================================================

  getPopularidadLotes: async (idProyecto?: number): Promise<PopularidadLoteDTO[]> => {
      // 1. Validación de lógica de negocio
      // En lugar de console.warn (que el usuario no ve), decidimos qué hacer:
      if (!idProyecto) {
        // Opción A: Si es un error del usuario, le avisamos:
        // notifyWarning("Seleccione un proyecto para ver las estadísticas.");
        
        // Opción B (Mejor para este caso): Simplemente no cargamos nada y retornamos vacío sin molestar.
        return []; 
      }

      // 2. Llamada al endpoint (ELIMINADO TRY/CATCH)
      // Si el backend falla (500), el Interceptor muestra el Snackbar automáticamente.
      // Si retorna el objeto error, la ejecución se detiene aquí y sube al componente.
      const { data } = await httpService.get<BackendEstadisticasResponse>(
        '/favoritos/estadisticas', 
        { params: { id_proyecto: idProyecto } }
      );

      // 3. Transformación de datos (Solo se ejecuta si la petición fue ÉXITO)
      const rawStats = data.estadisticas_lotes || [];
      const totalVotos = rawStats.reduce((acc, item) => acc + item.total_favoritos, 0);

      const mappedStats: PopularidadLoteDTO[] = rawStats.map(item => ({
        id_lote: item.lote.id,
        nombre_lote: item.lote.nombre_lote,
        cantidad_favoritos: item.total_favoritos,
        precio_base: item.lote.precio_base,
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((item.total_favoritos / totalVotos) * 100) 
          : 0
      }));

      return mappedStats.sort((a, b) => b.cantidad_favoritos - a.cantidad_favoritos);
  },

  // =================================================
  // 🔧 HELPERS FRONTEND
  // =================================================

  puedeAgregarFavorito(lote: LoteDto, tieneSuscripcionActiva: boolean): { puede: boolean; razon?: string } {
    if (!lote.activo) {
      return { puede: false, razon: 'El lote no está activo.' };
    }
    if (lote.id_proyecto && !tieneSuscripcionActiva) {
      return { 
        puede: false, 
        razon: 'Este es un lote exclusivo. Necesitas una suscripción activa al proyecto.' 
      };
    }
    return { puede: true };
  },

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