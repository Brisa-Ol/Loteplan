import type { 
  ConfirmInversion2faDto, 
  CreateInversionDto, 
  InversionDto, 
  InversionInitResponse, 
  InversionPorUsuarioDTO, 
  LiquidityRateDTO 
} from "@/core/types/dto/inversion.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";

const BASE_ENDPOINT = '/inversiones';

// Interfaz para la respuesta estándar del backend: { mensaje, data }
interface BackendResponse<T> {
    mensaje: string;
    data: T;
}

const InversionService = {

  // =================================================
  // 👤 CLIENTE (USUARIO INVERSIONISTA)
  // =================================================

  /**
   * Crea una nueva inversión directa.
   * Backend: inversionService.crearInversion
   * Endpoint: POST /inversiones
   */
  iniciar: async (data: CreateInversionDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}`, data);
  },

  /**
   * Inicia el flujo de pago (checkout) para una inversión existente.
   * Endpoint: POST /inversiones/iniciar-pago/:id
   */
  iniciarPago: async (inversionId: number): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${inversionId}`);
  },

  /**
   * Confirma la inversión mediante código 2FA.
   * Endpoint: POST /inversiones/confirmar-2fa
   */
  confirmar2FA: async (data: ConfirmInversion2faDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  /**
   * Obtiene las inversiones del usuario logueado.
   * Backend: inversionService.findByUserId
   * Endpoint: GET /inversiones/mis_inversiones
   * ⚠️ Nota: El backend suele devolver un array directo o { data: [...] }.
   * Ajustamos a BackendResponse<InversionDto[]> para ser consistentes.
   */
getMisInversiones: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_inversiones`);
  },

  /**
   * Obtiene el detalle de una inversión por ID.
   * Backend: inversionService.findById
   * Endpoint: GET /inversiones/:id
   */
getById: async (id: number): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene TODAS las inversiones (Dashboard Admin).
   * Backend: inversionService.findAll
   * Endpoint: GET /inversiones
   */
findAll: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene solo las inversiones activas (no borradas lógicamente).
   * Backend: inversionService.findAllActivo
   * Endpoint: GET /inversiones/activas
   */
  findAllActive: async (): Promise<AxiosResponse<BackendResponse<InversionDto[]>>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  /**
   * Actualiza datos de una inversión (Edición Admin).
   * Backend: inversionService.update
   * Endpoint: PUT /inversiones/:id
   */
  update: async (id: number, data: Partial<InversionDto>): Promise<AxiosResponse<BackendResponse<InversionDto>>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Realiza un borrado lógico de la inversión.
   * Backend: inversionService.softDelete
   * Endpoint: DELETE /inversiones/:id
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN) - KPIs 
  // =================================================

  /**
   * KPI 6: Tasa de Liquidez de Inversiones.
   * Backend: getInvestmentLiquidityRate
   * Endpoint: GET /inversiones/metricas/liquidez
   * Retorna: { total_invertido_registrado, total_pagado, tasa_liquidez }
   */
  getLiquidityMetrics: async (): Promise<AxiosResponse<BackendResponse<LiquidityRateDTO>>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/liquidez`);
  },

  /**
   * KPI 7: Rendimiento Agregado por Inversor.
   * Backend: getAggregatedInvestmentByUser
   * Endpoint: GET /inversiones/metricas/agregado-por-usuario
   * Retorna: Array de { id_usuario, monto_total_invertido, ... }
   */
  getAggregatedMetrics: async (): Promise<AxiosResponse<BackendResponse<InversionPorUsuarioDTO[]>>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/agregado-por-usuario`);
  }
};

export default InversionService;