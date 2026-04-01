import type { ConfirmarPago2faDto, CreatePagoManualDto, GenerateAdvancePaymentsDto, MonthlyMetricsDto, OnTimeMetricsDto, PagoCheckoutResponse, PagoDto, UpdatePaymentAmountDto, UpdatePaymentStatusDto } from '@/core/types/pago.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import type { GenericResponseDto } from '@/core/types/auth.dto';

const BASE_ENDPOINT = '/pagos';

/**
 * Servicio para la gestión de pagos.
 * Los errores HTTP son manejados automáticamente por el interceptor global.
 */
const PagoService = {

  // =================================================
  // 💳 FLUJO DE PAGO (USUARIO)
  // =================================================

  getMyPayments: async (): Promise<PagoDto[]> => {
  const response = await httpService.get(`${BASE_ENDPOINT}/mis_pagos`);
  return response.data.data;
},

  iniciarPagoMensual: async (idPago: number): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/pagar-mes/${idPago}`);
  },

  confirmarPago2FA: async (data: ConfirmarPago2faDto): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-pago-2fa`, data);
  },

  // 🆕 Obtiene el historial de pagos de una suscripción propia del usuario autenticado
  getMySubscriptionHistory: async (suscripcionId: number): Promise<AxiosResponse<{ message: string, data: PagoDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/historial/mi-suscripcion/${suscripcionId}`);
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
  },

  confirmarManual: async (idPago: number): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.patch(`${BASE_ENDPOINT}/${idPago}/estado`, { 
      estado_pago: 'pagado',
      motivo: 'Cobro manual administrativo (Efectivo/Oficina)' 
    });
  },

  // 🆕 Permite actualizar a cualquier estado válido y agregar un motivo (PATCH /:id/estado)
  updatePaymentStatus: async (idPago: number, data: UpdatePaymentStatusDto): Promise<AxiosResponse<{ message: string, pago: PagoDto }>> => {
    return await httpService.patch(`${BASE_ENDPOINT}/${idPago}/estado`, data);
  },

  // 🆕 Obtiene el historial completo de pagos de una suscripción para administradores
  getHistorialSuscripcion: async (suscripcionId: number): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/historial/suscripcion/${suscripcionId}`);
  }
};

export default PagoService;