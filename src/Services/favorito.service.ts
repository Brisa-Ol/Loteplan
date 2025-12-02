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

const FavoritoService = {
  // =================================================
  // ❤️ GESTIÓN USUARIO (Mis Favoritos)
  // =================================================

  /**
   * Agrega o quita un lote de favoritos (Toggle).
   * Backend: POST /favoritos/toggle
   * Middleware: authenticate
   * 
   * Validaciones del backend:
   * - Lote debe existir y estar activo
   * - Si el lote pertenece a un proyecto (lote privado), el usuario debe tener suscripción activa
   */
  toggle: async (idLote: number): Promise<AxiosResponse<ToggleFavoritoResponseDto>> => {
    const data: ToggleFavoritoRequestDto = { id_lote: idLote };
    return await httpService.post('/favoritos/toggle', data);
  },

  /**
   * Obtiene la lista de lotes favoritos del usuario actual.
   * Backend: GET /favoritos/mis-favoritos (con guión)
   * Middleware: authenticate
   * 
   * Respuesta: Array de LoteDto (solo lotes activos)
   */
  getMisFavoritos: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get('/favoritos/mis-favoritos');
  },

  /**
   * Verifica si un lote específico es favorito del usuario.
   * Backend: GET /favoritos/check/:id
   * Middleware: authenticate
   * 
   * Respuesta: { es_favorito: boolean }
   */
  checkEsFavorito: async (idLote: number): Promise<AxiosResponse<CheckFavoritoResponseDto>> => {
    return await httpService.get(`/favoritos/check/${idLote}`); // ✅ CORREGIDO: Paréntesis normales
  },

  // =================================================
  // 📊 ESTADÍSTICAS (Admin)
  // =================================================

  /**
   * Obtiene estadísticas de popularidad de lotes por proyecto.
   * Backend: GET /favoritos/estadisticas?id_proyecto=X
   * Middleware: authenticate + authorizeAdmin
   * 
   * ⚠️ NOTA CRÍTICA:
   * - El backend REQUIERE id_proyecto obligatorio (devuelve 400 si no se envía)
   * - La respuesta del backend tiene estructura anidada que este método aplana
   * - Calcula el porcentaje de popularidad en el frontend (backend no lo envía)
   * 
   * @param idProyecto - ID del proyecto (obligatorio)
   * @returns Array ordenado de lotes por popularidad (más populares primero)
   */
  getPopularidadLotes: async (idProyecto?: number): Promise<PopularidadLoteDTO[]> => {
    try {
      // Validación preventiva: Si no hay ID, retornar vacío para evitar error 400
      if (!idProyecto) {
        console.warn("FavoritoService: Backend requiere id_proyecto. Retornando array vacío.");
        return []; 
      }

      // Llamada al endpoint con query param
      const { data } = await httpService.get<BackendEstadisticasResponse>(
        '/favoritos/estadisticas', 
        { params: { id_proyecto: idProyecto } }
      );

      // Extraer array crudo de la estructura anidada
      const rawStats = data.estadisticas_lotes || [];

      // Calcular total de votos para los porcentajes relativos
      const totalVotos = rawStats.reduce((acc, item) => acc + item.total_favoritos, 0);

      // Transformar y aplanar la estructura
      const mappedStats: PopularidadLoteDTO[] = rawStats.map(item => ({
        id_lote: item.lote.id,
        nombre_lote: item.lote.nombre_lote,
        cantidad_favoritos: item.total_favoritos,
        precio_base: item.lote.precio_base,
        
        // ✅ Cálculo del porcentaje (no lo envía el backend)
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((item.total_favoritos / totalVotos) * 100) 
          : 0
      }));

      // Ordenar descendente por cantidad de favoritos
      return mappedStats.sort((a, b) => b.cantidad_favoritos - a.cantidad_favoritos);

    } catch (error) {
      console.error("Error en getPopularidadLotes:", error);
      return []; // Array vacío para que la UI no rompa
    }
  },

  // =================================================
  // 🔧 HELPERS FRONTEND
  // =================================================

  /**
   * Helper para determinar si se puede agregar a favoritos.
   * Validación en frontend antes de llamar toggle.
   */
  puedeAgregarFavorito(lote: LoteDto, tieneSuscripcionActiva: boolean): { 
    puede: boolean; 
    razon?: string 
  } {
    if (!lote.activo) {
      return { puede: false, razon: 'El lote no está activo' };
    }

    // Si es lote privado (tiene id_proyecto), valida suscripción
    if (lote.id_proyecto && !tieneSuscripcionActiva) {
      return { 
        puede: false, 
        razon: 'Necesitas suscripción activa al proyecto para agregar este lote a favoritos' 
      };
    }

    return { puede: true };
  },

  /**
   * Helper para formatear precio.
   */
  formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  }
};

export default FavoritoService;