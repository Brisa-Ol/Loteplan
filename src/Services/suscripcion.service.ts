// src/Services/suscripcion.service.ts
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

// 🚨 CORRECCIÓN BASADA EN TU APP.JS:
// "app.use('/api/suscripciones', suscripcionProyectoRoutes);"
const BASE_PRINCIPAL = '/suscripciones';

// "app.use('/api/suscripcionesCanceladas', suscripcionRoutes);"
const BASE_HISTORIAL = '/suscripcionesCanceladas'; 

const SuscripcionService = {
  
  // =================================================
  // 👤 GESTIÓN USUARIO (Operaciones normales)
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

  // Cancelación por parte del usuario (Soft Delete)
  cancelar: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

  confirmarWebhook: async (transaccionId: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/confirmar-pago`, { transaccionId });
  },

  // =================================================
  // 👮 GESTIÓN ADMIN - PRINCIPAL
  // =================================================

  // Obtener TODAS (Ruta: /api/suscripciones/)
  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(BASE_PRINCIPAL); 
  },

  // Obtener SOLO ACTIVAS (Ruta: /api/suscripciones/activas)
  findAllActivas: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/activas`); 
  },

  // Obtener por ID (Ruta: /api/suscripciones/:id)
  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/${id}`);
  },

  // Cancelar Admin (Ruta: DELETE /api/suscripciones/:id)
  cancelarAdmin: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/${id}`);
  },

  // Filtrar por proyecto (Todas)
  getAllByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}/all`);
  },

  // Filtrar por proyecto (Solo Activas)
  getActiveByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN) - SOLUCIONADO EL 404
  // =================================================

  getMorosityMetrics: async (): Promise<AxiosResponse<MorosidadDTO>> => {
    // Ruta final: /api/suscripciones/metrics/morosidad
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/morosidad`);
  },

  getCancellationMetrics: async (): Promise<AxiosResponse<CancelacionDTO>> => {
    // Ruta final: /api/suscripciones/metrics/cancelacion
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/cancelacion`);
  },

  // =================================================
  // 🛑 HISTORIAL DE CANCELADAS (TABLA SEPARADA)
  // Usan la ruta definida en app.js como "/api/suscripcionesCanceladas"
  // =================================================

  getAllCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    // Ruta final: /api/suscripcionesCanceladas/canceladas
    return await httpService.get(`${BASE_HISTORIAL}/canceladas`);
  },

  getMisCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/mis_canceladas`);
  },

  getCanceladasByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/proyecto/canceladas/${proyectoId}`);
  }
};

export default SuscripcionService;