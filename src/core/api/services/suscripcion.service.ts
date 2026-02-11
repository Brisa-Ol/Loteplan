// src/services/suscripcion.service.ts
import type { 
  CancelacionDTO, 
  ConfirmarSuscripcion2faDto, 
  IniciarSuscripcionDto, 
  MorosidadDTO, 
  SuscripcionCanceladaDto, 
  SuscripcionDto, 
  SuscripcionInitResponse 
} from '@/core/types/dto/suscripcion.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';

// ✅ RUTAS SINCRONIZADAS CON TU BACKEND (App.js)
const BASE_PRINCIPAL = '/suscripciones';
const BASE_HISTORIAL = '/suscripcionesCanceladas'; 

const SuscripcionService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Basado en suscripcion_proyecto.routes.js)
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
   * ✅ CORREGIDO: En tu back el usuario usa DELETE sobre /mis_suscripciones/:id
   */
  cancelar: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMIN (Basado en suscripcion_proyecto.routes.js)
  // =================================================

  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/`); 
  },

  findAllActivas: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/activas`); 
  },

  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/${id}`);
  },

  /**
   * ✅ CORREGIDO: Ruta específica para Admin
   */
  cancelarAdmin: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/${id}`);
  },

  // Métricas (KPIs)
  getMorosityMetrics: async (): Promise<AxiosResponse<MorosidadDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/morosidad`);
  },

  getCancellationMetrics: async (): Promise<AxiosResponse<CancelacionDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/cancelacion`);
  },

  // Proyectos
  getAllByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}/all`);
  },

  getActiveByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}`);
  },

  // =================================================
  // 🛑 HISTORIAL CANCELACIONES (Basado en suscripcion.routes.js)
  // =================================================

  /**
   * ✅ CORREGIDO: Ruta del usuario para ver sus canceladas
   */
  getMisCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/mis_canceladas`);
  },

  /**
   * ✅ CORREGIDO: Ruta del admin para ver historial general
   */
  getAllCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/canceladas`);
  },

  /**
   * ✅ CORREGIDO: Ruta del admin para ver historial por proyecto
   */
  getCanceladasByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/proyecto/canceladas/${proyectoId}`);
  }
};

export default SuscripcionService;