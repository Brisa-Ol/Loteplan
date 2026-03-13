import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import type { 
  SuscripcionCanceladaDto, 
  SuscripcionDto, 
  IniciarSuscripcionDto, 
  ConfirmarSuscripcion2faDto, 
  SuscripcionInitResponse,
  MorosidadDTO,
  CancelacionDTO 
} from '@/core/types/suscripcion.dto';

// Rutas base según App.js (asumiendo que así se montaron)
const BASE_PRINCIPAL = '/suscripciones'; 
const BASE_HISTORIAL = '/suscripcionesCanceladas'; 

const SuscripcionService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Operaciones Activas)
  // =================================================
  
  iniciar: async (data: IniciarSuscripcionDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/iniciar-pago`, data);
  },

  confirmar2FA: async (data: ConfirmarSuscripcion2faDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/confirmar-2fa`, data);
  },

  getMisSuscripciones: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/mis_suscripciones`);
  },

  getMiSuscripcionById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

  /**
   * Usuario cancela su propia suscripción. 
   * Backend: DELETE /suscripciones/mis_suscripciones/:id
   */
  cancelar: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMIN
  // =================================================

  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/`); 
  },

  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/${id}`);
  },

  /**
   * Admin cancela suscripción de un tercero
   * Backend: DELETE /suscripciones/:id
   */
  cancelarAdmin: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/${id}`);
  },

  // KPIs
  getMorosityMetrics: async (): Promise<AxiosResponse<MorosidadDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/morosidad`);
  },

  getCancellationMetrics: async (): Promise<AxiosResponse<CancelacionDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/cancelacion`);
  },

  // =================================================
  // 🛑 HISTORIAL DE CANCELACIONES
  // =================================================

  getMisCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    // Backend router: suscripcion.routes.js montado en /suscripcionesCanceladas
    return await httpService.get(`${BASE_HISTORIAL}/mis_canceladas`);
  },

  getAllCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/canceladas`);
  },

  getCanceladasByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/proyecto/canceladas/${proyectoId}`);
  }
};

export default SuscripcionService;