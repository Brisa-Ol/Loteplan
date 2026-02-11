// src/core/api/services/puja.service.ts

import type { ConfirmarPuja2faDto, CreatePujaDto, PujaCheckoutResponse, PujaDto } from "@/core/types/dto/puja.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";

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
   * 🔍 ASOCIACIONES BACKEND:
   * - `puja.lote` (incluye `lote.proyectoLote`)
   * - `puja.proyectoAsociado` (Alias definido en associations.js)
   * - `puja.suscripcion`
   */
  getMyPujas: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas`);
  },

  /**
   * Obtiene una puja específica del usuario.
   * Incluye relaciones completas: lote (con proyectoLote), proyectoAsociado y usuario.
   */
  getMyPujaById: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  cancelMyPuja: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  getAllActive: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  /**
   * Verifica si el usuario tiene alguna puja ganadora y pagada en un proyecto específico.
   * ⚠️ IMPORTANTE: Necesario para validar si el usuario puede cancelar su suscripción.
   * Backend: hasWonAndPaidBid
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
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Busca la puja más alta de un lote.
   * 🔍 ASOCIACIÓN: Incluye `lote` y dentro `lote.proyectoLote` (no proyectoAsociado).
   */
  getHighestBid: async (loteId: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/lote/${loteId}/highest`);
  },

  getAllAdmin: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Ejecuta el cierre de subasta.
   * El backend se encarga de liberar tokens (excepto Top 3).
   */
  manageAuctionEnd: async (idLote: number, idGanador: number | null): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/gestionar_finalizacion`, { 
      id_lote: idLote,
      id_ganador: idGanador 
    });
  },

  /**
   * Cancela una puja ganadora manualmente.
   * ✅ Ejecuta lógica de impago, devuelve token y procesa reasignación del lote.
   */
  cancelarGanadoraAnticipada: async (id: number, motivo: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/cancelar_puja_ganadora/${id}`, { 
        motivo_cancelacion: motivo 
    });
  },

  /**
   * Revierte el estado de 'ganadora_pagada' a 'ganadora_pendiente'.
   * ⚠️ Útil para revertir transacciones o corregir errores administrativos.
   * Backend: revertirPagoPujaGanadora
   */
  revertWinnerPayment: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/revertir_pago_ganadora/${id}`);
  },

  /**
   * Obtiene puja por ID con todas sus relaciones para el Admin.
   * Incluye `proyectoAsociado` y `lote.proyectoLote`.
   */
  getByIdAdmin: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  deleteAdmin: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default PujaService;