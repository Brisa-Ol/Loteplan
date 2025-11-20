// src/services/suscripcion.service.ts

import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CancellationMetricsDto, ConfirmarSuscripcion2faDto, ConfirmarSuscripcionWebhookDto, IniciarSuscripcionDto, MorosityMetricsDto, SuscripcionCanceladaDto, SuscripcionDto, SuscripcionInitResponse } from '../types/dto/suscripcion.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';
 // Ajusta la ruta a tus DTOs

// ⚠️ IMPORTANTE: Definimos ambos endpoints base aquí
const BASE_ENDPOINT = '/suscripciones';       // Para altas, pagos y consultas activas
const BASE_ENDPOINT_CANCEL = '/suscripcion';  // Para cancelaciones (singular, según tus rutas backend)

const SuscripcionService = {

  // =================================================
  // 🚀 PROCESO DE ALTA (USUARIO)
  // =================================================

  /**
   * Paso 1: Solicitar unirse al proyecto.
   * ⚠️ Puede devolver 202 si requiere 2FA.
   */
  iniciar: async (data: IniciarSuscripcionDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago`, data);
  },

  /**
   * Paso 2 (Si 2FA): Confirmar y obtener link de pago.
   */
  confirmar2FA: async (data: ConfirmarSuscripcion2faDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  /**
   * Webhook o confirmación manual post-pago.
   */
  confirmarPagoFinal: async (data: ConfirmarSuscripcionWebhookDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-pago`, data);
  },

  // =================================================
  // 👤 GESTIÓN USUARIO
  // =================================================

  getMySubscriptions: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_suscripciones`);
  },

  getMySubscriptionById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_suscripciones/${id}`);
  },

  /**
   * Cancelar suscripción propia (Soft Delete).
   * ⚠️ Requiere 2FA si es operación sensible.
   */
  cancelMySubscription: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    // Esta usa la ruta 'mis_suscripciones' del endpoint base plural
    return await httpService.delete(`${BASE_ENDPOINT}/mis_suscripciones/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMIN (Activas)
  // =================================================

  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findAllActive: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  findByProjectActive: async (idProyecto: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  findAllByProject: async (idProyecto: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}/all`);
  },

  findByIdAdmin: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  softDeleteAdmin: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 📊 MÉTRICAS
  // =================================================

  getMorosityMetrics: async (): Promise<AxiosResponse<MorosityMetricsDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metrics/morosidad`);
  },

  getCancellationMetrics: async (): Promise<AxiosResponse<CancellationMetricsDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metrics/cancelacion`);
  },

  // =================================================
  // 🛑 GESTIÓN DE CANCELACIONES (USUARIO - Historial)
  // =================================================

  /**
   * Cancela una suscripción propia (Endpoint alternativo o específico de cancelación).
   * Ruta: PUT /api/suscripcion/:id/cancelar
   */
  cancel: async (idSuscripcion: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.put(`${BASE_ENDPOINT_CANCEL}/${idSuscripcion}/cancelar`);
  },

  /**
   * Obtiene el historial de cancelaciones del usuario.
   * Ruta: GET /api/suscripcion/mis_canceladas
   */
  getMyCancellations: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT_CANCEL}/mis_canceladas`);
  },

  // =================================================
  // 👮 GESTIÓN DE CANCELACIONES (ADMIN)
  // =================================================

  /**
   * Obtiene TODAS las cancelaciones del sistema.
   * Ruta: GET /api/suscripcion/canceladas
   */
  findAllCanceled: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT_CANCEL}/canceladas`);
  },

  /**
   * Obtiene cancelaciones de un proyecto específico.
   * Ruta: GET /api/suscripcion/proyecto/canceladas/:id
   */
  findCanceledByProject: async (idProyecto: number): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT_CANCEL}/proyecto/canceladas/${idProyecto}`);
  }

};

export default SuscripcionService;