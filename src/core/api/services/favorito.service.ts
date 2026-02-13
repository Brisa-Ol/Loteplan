// src/services/favorito.service.ts

import type { CheckFavoritoResponseDto, PopularidadLoteDTO, ToggleFavoritoRequestDto, ToggleFavoritoResponseDto } from '@/core/types/dto/favorito.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import type { LoteDto } from '@/core/types/dto/lote.dto';

// ✅ Importamos la utilidad para alertas manuales (validaciones de negocio)

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

      if (typeof idProyecto === 'number') {
          params.id_proyecto = idProyecto;
      } else {
          params.modo = 'global';
          // ⚠️ Quitamos el limit o lo ponemos muy alto para traer todo del back
          params.limit = 100; 
      }

      const { data } = await httpService.get<any>('/favoritos/estadisticas', { params });
      const rawList = data.estadisticas_lotes || data.ranking || [];

      // 1. FILTRO: Dejamos pasar 'finalizada', solo ocultamos 'cancelada'
      const activeList = rawList.filter((item: any) => {
          const estado = item.estado_subasta?.toLowerCase();
          return estado !== 'cancelada'; 
      });

      const totalVotos = activeList.reduce((acc: number, item: any) => acc + Number(item.total_favoritos), 0);

      const mappedStats: PopularidadLoteDTO[] = activeList.map((item: any) => ({
        id_lote: item.id_lote,           
        nombre_lote: item.nombre_lote,   
        cantidad_favoritos: Number(item.total_favoritos),
        precio_base: Number(item.precio_base),
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((Number(item.total_favoritos) / totalVotos) * 100) 
          : 0
      }));

      // 2. RETORNO SIN CORTE: Eliminamos .slice(0, 5)
      // Devolvemos la lista completa ordenada
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