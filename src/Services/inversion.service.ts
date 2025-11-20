import type { AggregatedUserMetricDto, CheckoutResponse, ConfirmarPago2faDto, CreateInversionDto, CreateInversionResponse, InversionDto, LiquidityMetricDto } from '../types/dto/inversion.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


// Asumiendo ruta base definida en tu router
const BASE_ENDPOINT = '/inversiones'; 

const InversionService = {

  // =================================================
  // 💰 FLUJO DE CREACIÓN Y PAGO (USUARIO)
  // =================================================

  /**
   * Paso 1: Registrar la intención de inversión.
   * Estado resultante: 'pendiente'.
   */
  create: async (data: CreateInversionDto): Promise<AxiosResponse<CreateInversionResponse>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Paso 2: Solicitar el link de pago.
   * ⚠️ IMPORTANTE: Este método puede devolver status 202 (Accepted) si pide 2FA.
   * El componente debe verificar `response.data.is2FARequired`.
   */
  iniciarPago: async (idInversion: number): Promise<AxiosResponse<CheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${idInversion}`);
  },

  /**
   * Paso 3 (Solo si 2FA activo): Confirmar con código y obtener link.
   */
  confirmarPago2FA: async (data: ConfirmarPago2faDto): Promise<AxiosResponse<CheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  // =================================================
  // 🔍 CONSULTAS (USUARIO)
  // =================================================

  getMyInversions: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_inversiones`);
  },

  getMyInversionById: async (id: number): Promise<AxiosResponse<InversionDto>> => {
    // Nota: Tu backend tiene una ruta genérica /:id que verifica propiedad si es usuario
    // o permite acceso si es admin.
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN Y MÉTRICAS (ADMIN)
  // =================================================

  findAll: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT); // GET / (Admin)
  },

  findAllActive: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  /**
   * KPI 6: Tasa de Liquidez
   */
  getLiquidityMetrics: async (): Promise<AxiosResponse<{ mensaje: string, data: LiquidityMetricDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/liquidez`);
  },

  /**
   * KPI 7: Rendimiento por Inversor
   */
  getAggregatedMetrics: async (): Promise<AxiosResponse<{ mensaje: string, data: AggregatedUserMetricDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/agregado-por-usuario`);
  },

  // =================================================
  // 🛠️ EDICIÓN (ADMIN)
  // =================================================

  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default InversionService;