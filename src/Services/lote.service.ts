import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/lotes';

// Interfaces de respuesta específicas para acciones de subasta
export interface StartAuctionResponse {
    mensaje: string;
}

export interface EndAuctionResponse {
    mensaje: string;
}

const LoteService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================
  
  getAllActive: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  getByIdActive: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },
  
  getByProject: async (idProyecto: number): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
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

  delete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  findAllAdmin: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findByIdAdmin: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  findLotesNoAssociated: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/sin_proyecto`);
  },

  // =================================================
  // 🎯 CONTROL DE SUBASTA (ADMIN)
  // =================================================

  startAuction: async (id: number): Promise<AxiosResponse<StartAuctionResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/${id}/start_auction`);
  },

  endAuction: async (id: number): Promise<AxiosResponse<EndAuctionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/end`);
  },

  // =================================================
  // 🛠️ HELPERS VISUALES
  // =================================================

  calculatePaymentRisk: (lote: LoteDto) => {
    const intentos = lote.intentos_fallidos_pago || 0;
    if (intentos === 0) return { label: 'Normal', color: 'success' as const };
    if (intentos === 1) return { label: 'Riesgo Bajo (1/3)', color: 'warning' as const };
    if (intentos >= 2) return { label: 'Riesgo Crítico (2/3)', color: 'error' as const };
    return { label: 'Desconocido', color: 'default' as const };
  }
};

export default LoteService;