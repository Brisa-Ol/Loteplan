import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { 
  ConfirmarPago2faDto, 
  CreatePagoManualDto, 
  PagoCheckoutResponse, 
  PagoDto, 
  MonthlyMetricsDto, // ✅ Usando el alias
  OnTimeMetricsDto   // ✅ Usando el alias
} from '../types/dto/pago.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/pagos'; 

const PagoService = {

  // =================================================
  // 💳 FLUJO DE PAGO (USUARIO)
  // =================================================

  /**
   * Obtiene el historial de pagos del usuario.
   */
  getMyPayments: async (): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pagos`);
  },

  /**
   * Inicia el proceso de pago de una mensualidad.
   * ⚠️ Puede devolver status 202 si requiere 2FA.
   * El componente debe verificar response.status === 202
   */
  iniciarPagoMensual: async (idPago: number): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/pagar-mes/${idPago}`);
  },

  /**
   * Confirma el pago con código 2FA y obtiene la URL de pasarela.
   */
  confirmarPago2FA: async (data: ConfirmarPago2faDto): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-pago-2fa`, data);
  },

  // =================================================
  // 📊 MÉTRICAS Y ADMIN
  // =================================================

  findAll: async (): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findById: async (id: number): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * KPI 1 y 2: Morosidad y Recaudo
   * Backend retorna: { message: string, data: MonthlyMetricsDto }
   */
  getMonthlyMetrics: async (mes: number, anio: number): Promise<AxiosResponse<{ message: string, data: MonthlyMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/mensuales`, {
      params: { mes, anio }
    });
  },

  /**
   * KPI 3: Pagos a Tiempo
   * Backend retorna: { message: string, data: OnTimeMetricsDto }
   */
  getOnTimeMetrics: async (mes: number, anio: number): Promise<AxiosResponse<{ message: string, data: OnTimeMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/a-tiempo`, {
      params: { mes, anio }
    });
  },

  /**
   * Generar cuota manual (Testing/Admin)
   */
  triggerManualPayment: async (data: CreatePagoManualDto): Promise<AxiosResponse<any>> => {
    return await httpService.post(`${BASE_ENDPOINT}/trigger-manual-payment`, data);
  },

  update: async (id: number, data: Partial<PagoDto>): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default PagoService;