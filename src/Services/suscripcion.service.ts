// src/services/suscripcion.service.ts
import type { AxiosResponse } from 'axios';
import httpService from './httpService';
import type {
  SuscripcionDto,
  IniciarSuscripcionDto,
  ConfirmarSuscripcion2faDto,
  SuscripcionInitResponse,
  MorosidadDTO,
  CancelacionDTO,
  SuscripcionCanceladaDto
} from '../types/dto/suscripcion.dto';

const BASE_PRINCIPAL = '/suscripciones';
const BASE_HISTORIAL = '/suscripcionesCanceladas'; 

const SuscripcionService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Operaciones normales)
  // =================================================
  
  /**
   * Inicia el proceso de suscripción (Paso 1).
   * Backend: POST /api/suscripciones/iniciar-pago
   */
  iniciar: async (data: IniciarSuscripcionDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/iniciar-pago`, data);
  },

  /**
   * Confirma la suscripción con 2FA (Paso 2).
   * Backend: POST /api/suscripciones/confirmar-2fa
   */
  confirmar2FA: async (data: ConfirmarSuscripcion2faDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/confirmar-2fa`, data);
  },

  /**
   * Obtiene mis suscripciones activas.
   * Backend: GET /api/suscripciones/mis_suscripciones
   */
  getMisSuscripciones: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/mis_suscripciones`);
  },

  /**
   * Obtiene una suscripción propia por ID.
   * Backend: GET /api/suscripciones/mis_suscripciones/:id
   */
  getMiSuscripcionById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

  /**
   * Cancela una suscripción propia.
   * Backend: DELETE /api/suscripciones/mis_suscripciones/:id
   */
  cancelar: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMIN - PRINCIPAL
  // =================================================

  /**
   * Todas las suscripciones (activas e inactivas).
   * Backend: GET /api/suscripciones/
   */
  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(BASE_PRINCIPAL); 
  },

  /**
   * Solo suscripciones activas.
   * Backend: GET /api/suscripciones/activas
   */
  findAllActivas: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/activas`); 
  },

  /**
   * Suscripción por ID (Admin).
   * Backend: GET /api/suscripciones/:id
   */
  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/${id}`);
  },

  /**
   * Cancelar suscripción como Admin.
   * Backend: DELETE /api/suscripciones/:id
   */
  cancelarAdmin: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/${id}`);
  },

  /**
   * Todas las suscripciones de un proyecto (activas e inactivas).
   * Backend: GET /api/suscripciones/proyecto/:id_proyecto/all
   */
  getAllByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}/all`);
  },

  /**
   * Solo suscripciones activas de un proyecto.
   * Backend: GET /api/suscripciones/proyecto/:id_proyecto
   */
  getActiveByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN) - KPIs
  // =================================================

  /**
   * KPI Morosidad.
   * Backend: GET /api/suscripciones/metrics/morosidad
   */
  getMorosityMetrics: async (): Promise<AxiosResponse<MorosidadDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/morosidad`);
  },

  /**
   * KPI Cancelación.
   * Backend: GET /api/suscripciones/metrics/cancelacion
   */
  getCancellationMetrics: async (): Promise<AxiosResponse<CancelacionDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/cancelacion`);
  },

  // =================================================
  // 🛑 HISTORIAL DE CANCELADAS
  // =================================================

  /**
   * Todas las canceladas (Admin).
   * Backend: GET /api/suscripcionesCanceladas/canceladas
   */
  getAllCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/canceladas`);
  },

  /**
   * Mis canceladas (Usuario).
   * Backend: GET /api/suscripcionesCanceladas/mis_canceladas
   */
  getMisCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/mis_canceladas`);
  },

  /**
   * Canceladas por proyecto (Admin).
   * Backend: GET /api/suscripcionesCanceladas/proyecto/canceladas/:id
   */
  getCanceladasByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/proyecto/canceladas/${proyectoId}`);
  }
};

export default SuscripcionService;