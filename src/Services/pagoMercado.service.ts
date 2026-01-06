import type { CheckoutResponseDto, CreateCheckoutGenericoDto, PaymentStatusResponseDto } from '../types/dto/pagoMercado.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/payment'; // Ajustar según rutas (/api/payment)
/**
 * Servicio para la integración con Mercado Pago.
 * Conecta con el controlador `pagoMercadoController` del backend.
 * 
 * @remarks
 * - Este servicio maneja la creación de checkouts y consulta de estados
 * - Soporta múltiples modelos: inversión, puja, pago mensual
 * - Las URLs de checkout redirigen al usuario a Mercado Pago
 * - El backend procesa webhooks de Mercado Pago para actualizar estados
 * - Permite consultar estado de transacciones con refresh opcional
 */
const MercadoPagoService = {

  // =================================================
  // 🚀 INICIAR PAGO (CHECKOUT)
  // =================================================

  /**
 * Inicia el flujo de pago para una entidad específica (Inversión, Puja, Pago mensual).
   * 
   * @param modelo - Tipo de entidad: 'inversion', 'puja' o 'pago'
   * @param modeloId - ID de la entidad (inversión, puja o pago)
   * @returns Respuesta con URL de checkout de Mercado Pago
   * 
   * @remarks
   * Backend: POST /api/payment/checkout/:modelo/:modeloId
   * - Requiere autenticación
   * - Crea una preferencia de pago en Mercado Pago
   * - Retorna `redirectUrl` para redirigir al usuario
   * - El modelo determina qué entidad se está pagando
   * 
   */
  iniciarCheckoutModelo: async (modelo: 'inversion' | 'puja' | 'pago', modeloId: number): Promise<AxiosResponse<CheckoutResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/checkout/${modelo}/${modeloId}`);
  },

  /**
/**
   * Crea un checkout genérico o reintenta una transacción existente.
   * 
   * @param data - Datos del checkout (monto, descripción, transaccion_id opcional)
   * @returns Respuesta con URL de checkout
   * 
   * @remarks
   * Backend: POST /api/payment/checkout/generico
   * - Requiere autenticación
   * - Útil para pagos genéricos o reintentos
   * - Si se proporciona transaccion_id, reintenta la transacción existente
   * - Si no, crea una nueva preferencia de pago
   * 
   */
  createCheckoutGenerico: async (data: CreateCheckoutGenericoDto): Promise<AxiosResponse<CheckoutResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/checkout/generico`, data);
  },

  // =================================================
  // 🔍 CONSULTA DE ESTADO (RESULTADO)
  // =================================================

  /**
   * Obtiene el estado final de una transacción de pago.
   * 
   * @param idTransaccion - ID de la transacción en la BD (no el ID de Mercado Pago)
   * @param refresh - Si es true, fuerza consulta a la API de Mercado Pago
   * @returns Estado actualizado de la transacción
   * 
   * @remarks
   * Backend: GET /api/payment/status/:idTransaccion?refresh=true/false
   * - Requiere autenticación
   * - Por defecto retorna el estado almacenado en la BD
   * - Si refresh=true, consulta directamente a Mercado Pago (útil si el webhook falló)
   * - Actualiza el estado en la BD si hay cambios
   * - Retorna: estado, monto, fecha, detalles de Mercado Pago
   * 
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
   * 
   * @param response - Respuesta del checkout con redirectUrl
   * 
   * @remarks
   * - Si la respuesta incluye redirectUrl, redirige al usuario a Mercado Pago
   * - Si no hay URL, muestra un error en consola
   * - Útil para simplificar el flujo de redirección después del checkout
   * 
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