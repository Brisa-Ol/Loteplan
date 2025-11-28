// src/Services/inversion.service.ts
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
   * Inicia el proceso de inversión (Paso 1).
   * POST /inversiones/iniciar
   */
  iniciar: async (data: CreateInversionDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar`, data);
  },

  /**
   * Confirma inversión con 2FA (Paso 2).
   * POST /inversiones/confirmar-2fa
   */
  confirmar2FA: async (data: ConfirmInversion2faDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  /**
   * Confirma inversión tras webhook de MercadoPago (Paso 3).
   * POST /inversiones/confirmar-webhook
   */
  confirmarWebhook: async (transaccionId: number): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-webhook`, { transaccionId });
  },

  /**
   * Obtiene todas las inversiones del usuario logueado.
   * GET /inversiones/mis-inversiones
   */
  getMisInversiones: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis-inversiones`);
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

  /**
   * Obtiene todas las inversiones del sistema (Admin).
   * GET /inversiones
   */
  findAll: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene inversiones por usuario (Admin).
   * GET /inversiones/usuario/:userId
   */
  getByUserId: async (userId: number): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/usuario/${userId}`);
  },

  /**
   * Obtiene inversiones por proyecto (Admin).
   * GET /inversiones/proyecto/:proyectoId
   */
  getByProyectoId: async (proyectoId: number): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${proyectoId}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN)
  // =================================================

  /**
   * Obtiene la tasa de liquidez (inversiones pagadas vs registradas).
   * GET /inversiones/metricas/liquidez
   */
  getLiquidityMetrics: async (): Promise<AxiosResponse<{ data: LiquidityRateDTO }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/liquidez`);
  },

  /**
   * Obtiene inversión agregada por usuario (Top inversores).
   * GET /inversiones/metricas/agregado-por-usuario
   */
  getAggregatedMetrics: async (): Promise<AxiosResponse<{ data: InversionPorUsuarioDTO[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/agregado-por-usuario`);
  }
};

export default InversionService;