import type { ConfirmInversion2faDto, CreateInversionDto, InversionDto, InversionInitResponse, InversionPorUsuarioDTO, LiquidityRateDTO } from "@/core/types/dto/inversion.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";


const BASE_ENDPOINT = '/inversiones';

// Definimos una interfaz para la respuesta envuelta del backend
interface BackendResponse<T> {
    mensaje: string;
    data: T;
}

const InversionService = {

  // ... (Métodos de Gestión de Inversiones - SIN CAMBIOS) ...
  iniciar: async (data: CreateInversionDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}`, data);
  },

  iniciarPago: async (inversionId: number): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${inversionId}`);
  },

  confirmar2FA: async (data: ConfirmInversion2faDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  getMisInversiones: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_inversiones`);
  },

  getById: async (id: number): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // ... (Métodos Administrativos - SIN CAMBIOS) ...
  findAll: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findAllActive: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  update: async (id: number, data: Partial<InversionDto>): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN) - KPIs [CORREGIDO]
  // =================================================

  /**
   * Obtiene la tasa de liquidez de inversiones (KPI 6).
   * El backend devuelve: { mensaje: string, data: LiquidityRateDTO }
   */
  getLiquidityMetrics: async (): Promise<AxiosResponse<BackendResponse<LiquidityRateDTO>>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/liquidez`);
  },

  /**
   * Obtiene inversiones agregadas por usuario (KPI 7).
   * El backend devuelve: { mensaje: string, data: InversionPorUsuarioDTO[] }
   */
  getAggregatedMetrics: async (): Promise<AxiosResponse<BackendResponse<InversionPorUsuarioDTO[]>>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/agregado-por-usuario`);
  }
};

export default InversionService;