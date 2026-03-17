import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import type { CancelacionDTO, ConfirmarSuscripcion2faDto, IniciarSuscripcionDto, MorosidadDTO, SuscripcionCanceladaDto, SuscripcionDto, SuscripcionInitResponse } from '@/core/types/suscripcion.dto';


// 🔗 RUTAS SEGÚN App.js (backend)
const BASE_PROYECTO = '/suscripciones';           // suscripcion_proyecto.routes.js
const BASE_HISTORIAL = '/suscripcionesCanceladas'; // suscripcion.routes.js

const SuscripcionService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (suscripcion_proyecto.routes.js)
  // =================================================
  
  iniciar: async (data: IniciarSuscripcionDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PROYECTO}/iniciar-pago`, data);
  },

  confirmar2FA: async (data: ConfirmarSuscripcion2faDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PROYECTO}/confirmar-2fa`, data);
  },

  getMisSuscripciones: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PROYECTO}/mis_suscripciones`);
  },

  getMiSuscripcionById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PROYECTO}/mis_suscripciones/${id}`);
  },

  /** 🛑 Cancela la propia suscripción del cliente */
  cancelarMiSuscripcion: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.delete(`${BASE_PROYECTO}/mis_suscripciones/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMIN (suscripcion_proyecto.routes.js)
  // =================================================

  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PROYECTO}/`); 
  },

  /** 🆕 NUEVO: Obtiene solo suscripciones con activo: true */
  findAllActivas: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PROYECTO}/activas`); 
  },

  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PROYECTO}/${id}`);
  },

  /** 🚨 Baja administrativa (forzada por Admin) */
  cancelarAdmin: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.delete(`${BASE_PROYECTO}/${id}`);
  },

  // 📊 Métricas Administrativas
  getMorosityMetrics: async (): Promise<AxiosResponse<MorosidadDTO>> => {
    return await httpService.get(`${BASE_PROYECTO}/metrics/morosidad`);
  },

  getCancellationMetrics: async (): Promise<AxiosResponse<CancelacionDTO>> => {
    return await httpService.get(`${BASE_PROYECTO}/metrics/cancelacion`);
  },

  // =================================================
  // 🛑 HISTORIAL DE CANCELACIONES (suscripcion.routes.js)
  // =================================================

  getMisCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
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