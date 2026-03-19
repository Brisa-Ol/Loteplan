// src/services/mercadoPago.service.ts

import type { CheckoutResponseDto, CreateCheckoutGenericoDto, PaymentStatusResponseDto } from "@/core/types/pagoMercado.dto";
import { notifyError } from "@/shared/utils/snackbarUtils";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";


const BASE_ENDPOINT = '/payment';

/**
 * Servicio para la integración con Mercado Pago.
 * Conecta con el controlador `pagoMercadoController` del backend.
 */
const MercadoPagoService = {

  // =================================================
  // 🚀 INICIAR PAGO (CHECKOUT)
  // =================================================

  /**
   * Inicia el flujo de pago para una entidad específica.
   */
  iniciarCheckoutModelo: async (modelo: 'inversion' | 'puja' | 'pago', modeloId: number): Promise<AxiosResponse<CheckoutResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/checkout/${modelo}/${modeloId}`);
  },

  /**
   * Crea un checkout genérico o reintenta una transacción existente.
   */
  createCheckoutGenerico: async (data: CreateCheckoutGenericoDto): Promise<AxiosResponse<CheckoutResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/checkout/generico`, data);
  },

  // =================================================
  // 🔍 CONSULTA DE ESTADO (RESULTADO)
  // =================================================

  /**
   * Obtiene el estado final de una transacción de pago.
   */
  getPaymentStatus: async (idTransaccion: number, refresh: boolean = false): Promise<AxiosResponse<PaymentStatusResponseDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/status/${idTransaccion}`, {
      params: { refresh }
    });
  },

  // =================================================
  // 🛠️ UTILIDAD DE REDIRECCIÓN
  // =================================================

  /**
   * Helper para manejar la respuesta del checkout y redirigir al usuario.
   */
  handleRedirect: (response: CheckoutResponseDto) => {
    if (response.redirectUrl) {
      // Redirección externa a Mercado Pago
      window.location.href = response.redirectUrl;
    } else {
      // ❌ ELIMINADO: console.error
      // ✅ AHORA: Avisamos al usuario que algo salió mal con la respuesta
      notifyError('No se recibió la URL de pago de Mercado Pago. Intente nuevamente.');
    }
  }
};

export default MercadoPagoService;