import type {
  InversionDto,
  CreateInversionDto,
  InversionPorUsuarioDTO,
  LiquidityRateDTO,
  InversionInitResponse,
  ConfirmInversion2faDto
} from '../types/dto/inversion.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/inversiones';

const InversionService = {

  // =================================================
  // 💰 GESTIÓN DE INVERSIONES (USUARIO)
  // =================================================

  /**
   * Crea el registro de inversión (Paso 1).
   * Según tu ruta de backend: router.post("/", ...)
   */
  iniciar: async (data: CreateInversionDto): Promise<AxiosResponse<InversionInitResponse>> => {
    // Si tu backend usa POST / para crear, ajustamos aquí. 
    // Si antes usabas '/iniciar' y funcionaba, déjalo, pero según tu código backend es '/'
    return await httpService.post(`${BASE_ENDPOINT}`, data); 
  },

  /**
   * Inicia el flujo de checkout/pago (Paso 1.5).
   * Según tu ruta de backend: router.post("/iniciar-pago/:idInversion", ...)
   */
  iniciarPago: async (inversionId: number): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${inversionId}`);
  },

  /**
   * Confirma inversión con 2FA (Paso 2).
   * Según tu ruta de backend: router.post("/confirmar-2fa", ...)
   */
  confirmar2FA: async (data: ConfirmInversion2faDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  /**
   * Confirma inversión tras webhook (Paso 3 - Opcional según implementación).
   */
  confirmarWebhook: async (transaccionId: number): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-webhook`, { transaccionId });
  },

  /**
   * Obtiene todas las inversiones del usuario logueado.
   * ✅ CORREGIDO: Se ajustó la URL para coincidir con router.get("/mis_inversiones")
   */
  getMisInversiones: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_inversiones`);
  },

  /**
   * Obtiene una inversión específica por ID.
   * GET /inversiones/:id
   */
  getById: async (id: number): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA
  // =================================================

  findAll: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  getByUserId: async (userId: number): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/usuario/${userId}`);
  },

  getByProyectoId: async (proyectoId: number): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${proyectoId}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN)
  // =================================================

  getLiquidityMetrics: async (): Promise<AxiosResponse<{ data: LiquidityRateDTO }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/liquidez`);
  },

  getAggregatedMetrics: async (): Promise<AxiosResponse<{ data: InversionPorUsuarioDTO[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/agregado-por-usuario`);
  }
};

export default InversionService;