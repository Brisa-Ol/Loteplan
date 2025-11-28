// src/Services/suscripcion.service.ts
import type {
  SuscripcionDto,
  IniciarSuscripcionDto,
  ConfirmarSuscripcion2faDto,
  SuscripcionInitResponse,
  MorosidadDTO,
  CancelacionDTO
} from '../types/dto/suscripcion.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/suscripciones';

const SuscripcionService = {

  // =================================================
  // 📅 GESTIÓN DE SUSCRIPCIONES (USUARIO)
  // =================================================

  /**
   * Inicia el proceso de suscripción a un proyecto mensual (Paso 1).
   * POST /suscripciones/iniciar
   */
  iniciar: async (data: IniciarSuscripcionDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar`, data);
  },

  /**
   * Confirma suscripción con 2FA (Paso 2).
   * POST /suscripciones/confirmar-2fa
   */
  confirmar2FA: async (data: ConfirmarSuscripcion2faDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  /**
   * Confirma suscripción tras webhook de MercadoPago (Paso 3).
   * POST /suscripciones/confirmar-webhook
   */
  confirmarWebhook: async (transaccionId: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-webhook`, { transaccionId });
  },

  /**
   * Obtiene todas las suscripciones activas del usuario logueado.
   * GET /suscripciones/mis-suscripciones
   */
  getMisSuscripciones: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis-suscripciones`);
  },

  /**
   * Obtiene una suscripción específica por ID.
   * GET /suscripciones/:id
   */
  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Cancela una suscripción activa.
   * POST /suscripciones/:id/cancelar
   */
  cancelar: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/${id}/cancelar`);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA
  // =================================================

  /**
   * Obtiene todas las suscripciones del sistema (Admin).
   * GET /suscripciones
   */
  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene suscripciones por usuario (Admin).
   * GET /suscripciones/usuario/:userId
   */
  getByUserId: async (userId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/usuario/${userId}`);
  },

  /**
   * Obtiene suscripciones por proyecto (Admin).
   * GET /suscripciones/proyecto/:proyectoId
   */
  getByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${proyectoId}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN)
  // =================================================

  /**
   * Obtiene la tasa de morosidad del sistema.
   * GET /suscripciones/metrics/morosidad
   */
  getMorosityMetrics: async (): Promise<AxiosResponse<{ data: MorosidadDTO }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metrics/morosidad`);
  },

  /**
   * Obtiene la tasa de cancelación del sistema.
   * GET /suscripciones/metrics/cancelacion
   */
  getCancellationMetrics: async (): Promise<AxiosResponse<{ data: CancelacionDTO }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metrics/cancelacion`);
  }
};

export default SuscripcionService;