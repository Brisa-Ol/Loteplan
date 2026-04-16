// src/core/api/services/puja.service.ts

import type { GenericResponseDto } from "@/core/types/auth.dto";
import type { ConfirmarPuja2faDto, CreatePujaDto, PujaCheckoutResponse, PujaDto } from "@/core/types/puja.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";

const BASE_ENDPOINT = '/pujas';

/**
 * Servicio para la gestión de Pujas (Subastas).
 * Sincronizado con pujaService.js y associations.js del backend.
 */
const PujaService = {

  // =================================================
  // 👤 CLIENTE (USUARIO AHORRISTA)
  // =================================================

  /**
   * Crea o actualiza una puja.
   * El backend maneja internamente la lógica de "si ya existe, actualiza el monto".
   */
  create: async (data: CreatePujaDto): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Obtiene el historial de pujas del usuario.
   */
  getMyPujas: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas`);
  },

  /**
   * Obtiene una puja específica del usuario.
   */
  getMyPujaById: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  /**
   * Retira (cancela) la puja activa del usuario y devuelve el token inmediatamente.
   *
   * ✅ RUTA ACTUALIZADA: DELETE /mis_pujas/:id/retirar
   * (La ruta antigua DELETE /mis_pujas/:id fue reemplazada por esta nueva implementación
   * que además devuelve el token al instante y recalcula la puja más alta del lote.)
   *
   * REGLAS DE NEGOCIO (backend):
   * - La puja DEBE estar en estado 'activa'
   * - La subasta del lote DEBE estar en estado 'activa'
   * - El token se devuelve en el acto a la suscripción del usuario
   *
   * Respuesta: { success, message, data: { pujaId, loteId, tokenDevuelto } }
   */
  cancelMyPuja: async (id: number): Promise<AxiosResponse<{ success: boolean; message: string; data: { pujaId: number; loteId: number; tokenDevuelto: boolean } }>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/mis_pujas/${id}/retirar`);
  },

  getAllActive: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  /**
   * Verifica si el usuario tiene alguna puja ganadora y pagada en un proyecto específico.
   * ⚠️ IMPORTANTE: Necesario para validar si el usuario puede cancelar su suscripción.
   */
  checkWonAndPaid: async (projectId: number): Promise<AxiosResponse<boolean>> => {
    return await httpService.get(`${BASE_ENDPOINT}/check_won_paid/proyecto/${projectId}`);
  },

  // =================================================
  // 💳 PROCESO DE PAGO
  // =================================================

  initiatePayment: async (id: number): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${id}`);
  },

  confirmPayment2FA: async (data: ConfirmarPuja2faDto): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  // =================================================
  // 💳 Solicitud de baja de Pago
  // =================================================

  requestCancellation: async (id: number, motivo: string): Promise<AxiosResponse<PujaDto>> => {
    try {
      const res = await httpService.post(`${BASE_ENDPOINT}/mis_pujas/${id}/solicitar-cancelacion`, {
        motivo_cancelacion: motivo
      });
      return res.data
    } catch (error) {
      console.error("Error al solicitar cancelación de puja:", error);
      throw error; // Re-lanzar el error para que el componente pueda manejarlo
    }
  },


  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  getHighestBid: async (loteId: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/lote/${loteId}/highest`);
  },

  getAllAdmin: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  manageAuctionEnd: async (idLote: number, idGanador: number | null): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/gestionar_finalizacion`, {
      id_lote: idLote,
      id_ganador: idGanador
    });
  },

  cancelarGanadoraAnticipada: async (id: number, motivo: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/cancelar_puja_ganadora/${id}`, {
      motivo_cancelacion: motivo
    });
  },

  revertWinnerPayment: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/revertir_pago_ganadora/${id}`);
  },

  getByIdAdmin: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  deleteAdmin: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default PujaService;