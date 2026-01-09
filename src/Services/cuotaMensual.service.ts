import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { 
    CreateCuotaMensualDto, 
    CuotaMensualDto, 
    UpdateCuotaMensualDto,
    CuotaBackendResponse // Importamos el nuevo tipo
} from '../types/dto/cuotaMensual.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const CuotaMensualService = {

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA
  // =================================================

  /**
   * Crea una nueva cuota.
   * El back devuelve { success: true, cuota: {...}, sincronizacion: {...} }
   */
  create: async (data: CreateCuotaMensualDto): Promise<AxiosResponse<CuotaBackendResponse>> => {
    return await httpService.post('/cuotas_mensuales', data);
  },

  /**
   * Actualiza una cuota.
   */
  update: async (id: number, data: UpdateCuotaMensualDto): Promise<AxiosResponse<CuotaBackendResponse>> => {
    return await httpService.put(`/cuotas_mensuales/${id}`, data);
  },

  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`/cuotas_mensuales/${id}`);
  },

  // =================================================
  // 🔍 CONSULTAS
  // =================================================

  /**
   * Obtiene lista de cuotas (Historial).
   * El back devuelve { success: true, cuotas: [...] }
   */
  getByProjectId: async (idProyecto: number): Promise<AxiosResponse<{ success: boolean, cuotas: CuotaMensualDto[] }>> => {
    return await httpService.get(`/cuotas_mensuales/${idProyecto}`);
  },

  /**
   * Obtiene la última cuota activa.
   * 🔴 CORREGIDO: Se eliminó "/proyecto" de la URL para coincidir con el backend `/:id_proyecto/last`
   */
  getLastByProjectId: async (idProyecto: number): Promise<AxiosResponse<{ success: boolean, cuota: CuotaMensualDto }>> => {
    return await httpService.get(`/cuotas_mensuales/${idProyecto}/last`); 
  }
};

export default CuotaMensualService;