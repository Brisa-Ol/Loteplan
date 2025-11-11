// src/services/puja.service.ts
import httpService from './httpService';

// Importamos los DTOs necesarios
import type {
  PujaDTO,
  CreatePujaDTO,
  RequestCheckoutPujaResponseDTO
} from '../types/dto/puja.dto.ts';

// La ruta base es /api/pujas (según tu index.js)
const ENDPOINT = '/pujas';

/**
 * Obtiene todas las pujas (activas e inactivas) del usuario logueado.
 * Llama a: GET /api/pujas/mis-pujas
 * (Asumiendo una ruta que usa 'findByUserId').
 */
export const getMisPujas = (): Promise<PujaDTO[]> => {
  return httpService.get(`${ENDPOINT}/mis-pujas`);
};

/**
 * Envía una nueva puja o actualiza una existente para un lote.
 * Llama a: POST /api/pujas
 * (Tu backend usa 'create').
 */
export const submitPuja = (data: CreatePujaDTO): Promise<PujaDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * 💳 Inicia el proceso de pago para una puja ganadora pendiente.
 * Llama a: POST /api/pujas/:pujaId/checkout
 * (Asumiendo una ruta que usa 'requestCheckoutForPuja').
 */
export const requestBidCheckout = (pujaId: number): Promise<RequestCheckoutPujaResponseDTO> => {
  // Enviamos el ID en la URL.
  // Recibimos la transacción y la URL de Mercado Pago.
  return httpService.post(`${ENDPOINT}/${pujaId}/checkout`);
};

/**
 * Obtiene una puja específica por ID (si pertenece al usuario).
 * Llama a: GET /api/pujas/:id
 * (Asumiendo que la ruta usa 'findByIdAndUserId').
 */
export const getPujaById = (id: number): Promise<PujaDTO> => {
  return httpService.get(`${ENDPOINT}/${id}`);
};