import type { CheckoutResponseDto, CreateCheckoutGenericoDto, PaymentStatusResponseDto } from '../types/dto/pagoMercado.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/payment'; // Ajustar según rutas (/api/payment)

const MercadoPagoService = {

  // =================================================
  // 🚀 INICIAR PAGO (CHECKOUT)
  // =================================================

  /**
   * Inicia el flujo de pago para una entidad específica (Inversión, Puja, Cuota).
   * 🔗 Retorna la URL de Mercado Pago.
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
   * Obtiene el estado final de la transacción.
   * @param idTransaccion - ID de tu base de datos (no el de MP).
   * @param refresh - Si es true, fuerza al backend a consultar a la API de MP (útil si el webhook falló).
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
   * Helper para manejar la respuesta del checkout.
   * Si hay URL, redirige al usuario fuera de la app (a Mercado Pago).
   */
  handleRedirect: (response: CheckoutResponseDto) => {
    if (response.redirectUrl) {
      // Redirección externa
      window.location.href = response.redirectUrl;
    } else {
      console.error('No se recibió URL de redirección de Mercado Pago');
    }
  }
};

export default MercadoPagoService;