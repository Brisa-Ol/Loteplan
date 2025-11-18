// src/services/pago.service.ts (CORREGIDO)
import httpService from './httpService';
// 👇 Importar TODOS los tipos necesarios desde el archivo DTO
import type { 
  PagoDTO, 
  CreatePagoInicialDTO, // DTO para cuota 1
  CreatePaymentOrderDTO,
  IniciarCheckoutResponseDTO // DTO para iniciar checkout
} from '../types/dto/pago.dto';

const PAGO_ENDPOINT = '/pagos';
const SUSCRIPCION_ENDPOINT = '/suscripciones'; 

export const crearPagoInicial = (data: CreatePagoInicialDTO): Promise<PagoDTO> => {
  // Llama a: POST /api/suscripciones/iniciar-pago
  return httpService.post(`${SUSCRIPCION_ENDPOINT}/iniciar-pago`, data);
};

/**
 * Llama a: GET /api/pagos/mis-pagos
 */
export const getMisPagos = (): Promise<PagoDTO[]> => {
  return httpService.get(`${PAGO_ENDPOINT}/mis_pagos`); 
};

/**
 * Obtiene un pago específico por ID.
 * Llama a: GET /api/pagos/:id
 */
export const getPagoById = (id: number): Promise<PagoDTO> => {
  return httpService.get(`${PAGO_ENDPOINT}/${id}`);
};
/**
 * Inicia el pago de una cuota mensual específica.
 * Llama a: POST /api/pagos/pagar-mes/:id
 */
export const createPaymentOrder = (pagoId: Number): Promise<any> => {
  return httpService.post(`${PAGO_ENDPOINT}/pagar-mes/${pagoId}`);
};

export const iniciarPagoSuscripcion = (data: CreatePagoInicialDTO): Promise<IniciarCheckoutResponseDTO> => {
  return httpService.post(`${SUSCRIPCION_ENDPOINT}/iniciar-pago`, data);
};

/**
 * 🔴 ADMIN: Obtiene métricas de recaudo mensual
 * Llama a: GET /api/pagos/metricas/mensuales?mes=...&anio=...
 */
export const getMetricasRecaudoMensual = async (mes: number, anio: number) => {
  const { data } = await httpService.get(`${PAGO_ENDPOINT}/metricas/mensuales`, {
    params: { mes, anio }
  });
  return data;
};

/**
 * 🔴 ADMIN: Obtiene tasa de pagos a tiempo
 * Llama a: GET /api/pagos/metricas/a-tiempo?mes=...&anio=...
 */
export const getTasaPagosATiempo = async (mes: number, anio: number) => {
  const { data } = await httpService.get(`${PAGO_ENDPOINT}/metricas/a-tiempo`, {
    params: { mes, anio }
  });
  return data;
};

