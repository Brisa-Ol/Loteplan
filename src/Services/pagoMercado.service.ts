import httpService from './httpService';
import type { IniciarCheckoutResponseDTO } from '../types/dto/transaccion.dto'; 

// Ruta base /api/payment
const PAYMENT_ENDPOINT = '/payment'; 

/**
 * (Inversionista STEP B)
 * Inicia el checkout para una Inversión ya creada.
 * Llama a: POST /api/payment/checkout/inversion/:id
 */
export const iniciarCheckoutInversion = (inversionId: number): Promise<IniciarCheckoutResponseDTO> => {
  return httpService.post(`${PAYMENT_ENDPOINT}/checkout/inversion/${inversionId}`);
};