import type {
  AdhesionDto,
  AdhesionMetricsDto,
  CrearAdhesionDto,
  ForzarPagoCuotaDto,
  PagarCuotaAdhesionDto,
  PagoAdhesionDto
} from '@/core/types/adhesion.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';

const BASE_ENDPOINT = '/adhesion';

const AdhesionService = {

  // =================================================
  // 👤 RUTAS DE USUARIO
  // =================================================

  crearAdhesion: async (data: CrearAdhesionDto): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/`, data);
  },

  obtenerAdhesion: async (id: number): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  listarAdhesionesUsuario: async (): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/usuario`);
  },

  obtenerAdhesionPorSuscripcion: async (suscripcionId: number): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/suscripcion/${suscripcionId}`);
  },

  pagarCuotaAdhesion: async (data: PagarCuotaAdhesionDto): Promise<AxiosResponse<{ success: boolean, redirectUrl: string }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/pagar-cuota`, data);
  },

  cancelarAdhesion: async (id: number, motivo?: string): Promise<AxiosResponse<{ success: boolean, message: string }>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`, { data: { motivo } });
  },

  // =================================================
  // 👮 RUTAS DE ADMINISTRADOR
  // =================================================

  forzarPagoCuota: async (data: ForzarPagoCuotaDto): Promise<AxiosResponse<{ success: boolean, message: string, adhesionId: number, completada: boolean }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/admin/forzar-pago`, data);
  },

  listarTodasAdhesiones: async (): Promise<AxiosResponse<{ success: boolean, total: number, data: AdhesionDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/all`);
  },

  getAdhesionMetrics: async (): Promise<AxiosResponse<{ success: boolean, data: AdhesionMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/metrics`);
  },

  getOverdueAdhesionPayments: async (): Promise<AxiosResponse<{ success: boolean, data: PagoAdhesionDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/overdue`);
  },

  getPaymentHistory: async (adhesionId: number): Promise<AxiosResponse<{ success: boolean, data: AdhesionDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/payment-history/${adhesionId}`);
  }
};

export default AdhesionService;