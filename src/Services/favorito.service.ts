import type { 
  CheckFavoritoResponseDto, 
  ToggleFavoritoRequestDto, 
  ToggleFavoritoResponseDto,
  PopularidadLoteDTO
} from '../types/dto/favorito.dto';
import type { LoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const FavoritoService = {
  // ... (toggle, getMisFavoritos, checkEsFavorito siguen igual)

  // =================================================
  // 📊 ESTADÍSTICAS (Admin)
  // =================================================

  getPopularidadLotes: async (idProyecto?: number | 'global'): Promise<PopularidadLoteDTO[]> => {
      const params: any = {};

      if (typeof idProyecto === 'number') {
          params.id_proyecto = idProyecto;
      } else {
          params.modo = 'global';
          params.limit = 10; // Traemos un poco más para tener margen al filtrar
      }

      const { data } = await httpService.get<any>('/favoritos/estadisticas', { params });

      // 1. Obtener la lista cruda
      const rawList = data.estadisticas_lotes || data.ranking || [];

      // 2. 🛑 FILTRO DE NEGOCIO: Excluir lotes finalizados
      // Solo mostramos 'activa' o 'pendiente'.
      const activeList = rawList.filter((item: any) => {
          const estado = item.estado_subasta?.toLowerCase();
          return estado !== 'finalizada' && estado !== 'cancelada';
      });

      // 3. Calcular el total SOBRE LA LISTA FILTRADA
      // Esto es importante para que el porcentaje (barra de progreso) sea relativo a lo que se ve
      const totalVotos = activeList.reduce((acc: number, item: any) => acc + Number(item.total_favoritos), 0);

      // 4. Mapeo a DTO
      const mappedStats: PopularidadLoteDTO[] = activeList.map((item: any) => ({
        id_lote: item.id_lote,
        nombre_lote: item.nombre_lote,
        // Aseguramos conversión a números
        cantidad_favoritos: Number(item.total_favoritos),
        precio_base: Number(item.precio_base),
        
        // Porcentaje basado en los lotes visibles
        porcentaje_popularidad: totalVotos > 0 
          ? Math.round((Number(item.total_favoritos) / totalVotos) * 100) 
          : 0
      }));

      // 5. Ordenar y cortar al Top 5 final
      return mappedStats
        .sort((a, b) => b.cantidad_favoritos - a.cantidad_favoritos)
        .slice(0, 5);
  },

  // ... (helpers siguen igual)
  formatPrecio(precio: number): string {
    if (precio === undefined || precio === null) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  },

  puedeAgregarFavorito(lote: LoteDto, tieneSuscripcionActiva: boolean): { puede: boolean; razon?: string } {
    if (!lote.activo) return { puede: false, razon: 'El lote no está activo.' };
    if (lote.id_proyecto && !tieneSuscripcionActiva) return { puede: false, razon: 'Requiere suscripción activa.' };
    return { puede: true };
  }
};

export default FavoritoService;