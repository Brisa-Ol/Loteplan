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
   */
  toggle: async (idLote: number): Promise<AxiosResponse<ToggleFavoritoResponseDto>> => {
    const data: ToggleFavoritoRequestDto = { id_lote: idLote };
    return await httpService.post<ToggleFavoritoResponseDto>('/favoritos/toggle', data);
  },

  /**
   * Obtiene la lista de favoritos del usuario.
   */
  getMisFavoritos: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get<LoteDto[]>('/favoritos/mis-favoritos');
  },

  /**
   * Verifica si un lote específico es favorito.
   */
  checkEsFavorito: async (idLote: number): Promise<AxiosResponse<CheckFavoritoResponseDto>> => {
    return await httpService.get<CheckFavoritoResponseDto>(`/favoritos/check/${idLote}`);
  },

  // =================================================
  // 📊 ESTADÍSTICAS (Admin) - LÓGICA CORREGIDA
  // =================================================

  getPopularidadLotes: async (idProyecto?: number | 'global'): Promise<PopularidadLoteDTO[]> => {
      const params: any = {};

      // 1. Configurar parámetros según modo
      if (typeof idProyecto === 'number') {
          params.id_proyecto = idProyecto;
      } else {
          params.modo = 'global';
          params.limit = 10; // Traemos un poco más para tener margen al filtrar
      }

      // 2. Llamada al Backend
      // Usamos 'any' en la respuesta axios porque la estructura varía según el modo
      const { data } = await httpService.get<any>('/favoritos/estadisticas', { params });

      // 3. 🔍 DETECCIÓN DE ESTRUCTURA (Desestructuración)
      // Si viene por proyecto, la lista está en 'estadisticas_lotes'.
      // Si viene global, la lista está en 'ranking'.
      const rawList = data.estadisticas_lotes || data.ranking || [];

      // 4. 🛑 FILTRO DE NEGOCIO: Excluir lotes finalizados o cancelados
      const activeList = rawList.filter((item: any) => {
          const estado = item.estado_subasta?.toLowerCase();
          return estado !== 'finalizada' && estado !== 'cancelada';
      });

      // 5. Calcular el total SOBRE LA LISTA FILTRADA
      // Esto es importante para que el porcentaje (barra de progreso) sea relativo a lo que se ve
      const totalVotos = activeList.reduce((acc: number, item: any) => acc + Number(item.total_favoritos), 0);

      // 6. Mapeo a DTO del Frontend
      const mappedStats: PopularidadLoteDTO[] = activeList.map((item: any) => ({
        id_lote: item.id_lote,           
        nombre_lote: item.nombre_lote,   
        // Aseguramos que sean números
        cantidad_favoritos: Number(item.total_favoritos),
        precio_base: Number(item.precio_base),
        
        // Cálculo del porcentaje para la barra de progreso
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((Number(item.total_favoritos) / totalVotos) * 100) 
          : 0
      }));

      // Ordenar y cortar al Top 5 final
      return mappedStats
        .sort((a, b) => b.cantidad_favoritos - a.cantidad_favoritos)
        .slice(0, 5);
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