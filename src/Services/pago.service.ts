// src/services/pago.service.ts
import type { GenericResponseDto } from '../types/dto/auth.dto';
import type {
  ConfirmarPago2faDto,
  CreatePagoManualDto,
  PagoCheckoutResponse,
  PagoDto,
  MonthlyMetricsDto,
  OnTimeMetricsDto,
  GenerateAdvancePaymentsDto,
  UpdatePaymentAmountDto
} from '../types/dto/pago.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/pagos';

/**
 * Servicio para la gestión de pagos.
 * Los errores HTTP son manejados automáticamente por el interceptor global.
 */
const PagoService = {

  // =================================================
  // 💳 FLUJO DE PAGO (USUARIO)
  // =================================================

  getMyPayments: async (): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pagos`);
  },

  iniciarPagoMensual: async (idPago: number): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/pagar-mes/${idPago}`);
  },

  confirmarPago2FA: async (data: ConfirmarPago2faDto): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-pago-2fa`, data);
  },

  // =================================================
  // 📊 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  findAll: async (): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findById: async (id: number): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  getMonthlyMetrics: async (mes: number, anio: number): Promise<AxiosResponse<{ message: string, data: MonthlyMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/mensuales`, {
      params: { mes, anio }
    });
  },

  getOnTimeMetrics: async (mes: number, anio: number): Promise<AxiosResponse<{ message: string, data: OnTimeMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/a-tiempo`, {
      params: { mes, anio }
    });
  },

  triggerManualPayment: async (data: CreatePagoManualDto): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/trigger-manual-payment`, data);
  },

  update: async (id: number, data: Partial<PagoDto>): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 🆕 FUNCIONES AVANZADAS (ADMIN)
  // =================================================

  generateAdvancePayments: async (data: GenerateAdvancePaymentsDto): Promise<AxiosResponse<{ message: string, pagos: PagoDto[] }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/generar-adelantados`, data);
  },

  getPendingBySubscription: async (idSuscripcion: number): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/pendientes/suscripcion/${idSuscripcion}`);
  },

  updatePaymentAmount: async (idPago: number, data: UpdatePaymentAmountDto): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.patch(`${BASE_ENDPOINT}/${idPago}/monto`, data);
  }
};

export default PagoService;