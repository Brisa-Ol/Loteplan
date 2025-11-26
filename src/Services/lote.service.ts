import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/lotes';

// Definimos las respuestas específicas para las acciones de subasta
// para poder tipar correctamente el retorno (el ganador, el lote actualizado, etc.)
interface StartAuctionResponse {
  mensaje: string;
  lote?: LoteDto;
}

interface EndAuctionResponse {
  mensaje: string;
  lote?: LoteDto;
  ganador?: {
    id: number;
    nombre: string;
  };
}

const LoteService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================

  /**
   * Obtiene todos los lotes activos (Catálogo principal).
   */
  getAllActive: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  /**
   * Obtiene detalle de un lote activo.
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  create: async (data: CreateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  update: async (id: number, data: UpdateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Soft delete (borrado lógico).
   */
  delete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  findAllAdmin: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findByIdAdmin: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene lotes "huérfanos" (sin proyecto asignado).
   * Útil para el panel de "Asignar Lotes a Proyecto".
   */
  getUnassigned: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/sin_proyecto`);
  },

  /**
   * Obtiene todos los lotes de un proyecto específico (Vista Admin).
   */
  getByProject: async (idProyecto: number): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  // =================================================
  // 🔨 CONTROL DE SUBASTA (ADMIN)
  // =================================================

  /**
   * Inicia manualmente la subasta.
   * Dispara notificaciones a suscriptores.
   */
  startAuction: async (id: number): Promise<AxiosResponse<StartAuctionResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/${id}/start_auction`);
  },

  /**
   * Finaliza manualmente la subasta.
   * Asigna ganador y genera transacción.
   */
  endAuction: async (id: number): Promise<AxiosResponse<EndAuctionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/end`);
  }
};

export default LoteService;