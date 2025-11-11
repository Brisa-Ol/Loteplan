  // src/services/transaccion.service.ts
  import httpService from './httpService';

  // Importamos los DTOs necesarios
  import type {
    TransaccionDTO,
    IniciarCheckoutDTO,
    IniciarCheckoutResponseDTO
  } from '../types/dto/transaccion.dto.ts';

  // La ruta base es /api/transacciones (según tu index.js)
  const ENDPOINT = '/transacciones';

  /**
   * 💳 FUNCIÓN CLAVE: Inicia el proceso de checkout para cualquier tipo de pago.
   * Llama a: POST /api/transacciones/iniciar-checkout
   * (Asumiendo una ruta que usa 'iniciarTransaccionYCheckout').
   */
  export const iniciarCheckout = (data: IniciarCheckoutDTO): Promise<IniciarCheckoutResponseDTO> => {

    return httpService.post(`${ENDPOINT}/iniciar-checkout`, data);
  };

  /**
   * Obtiene el historial de transacciones del usuario logueado.
   * Llama a: GET /api/transacciones/mis-transacciones
   * (Asumiendo una ruta que usa 'findByUserId').
   */
  export const getMisTransacciones = (): Promise<TransaccionDTO[]> => {
    return httpService.get(`${ENDPOINT}/mis-transacciones`);
  };

  /**
   * Obtiene una transacción específica por ID (si pertenece al usuario).
   * Llama a: GET /api/transacciones/:id
   * (Asumiendo que la ruta usa 'findById' y valida la propiedad).
   */
  export const getTransaccionById = (id: number): Promise<TransaccionDTO | null> => {
    return httpService.get(`${ENDPOINT}/${id}`);
  };

  // --- Funciones para Administradores (Opcional) ---

  /**
   * (Admin) Obtiene TODAS las transacciones del sistema.
   * Llama a: GET /api/transacciones
   * (Tu backend usa 'findAll').
   */
  export const getAllTransacciones = (): Promise<TransaccionDTO[]> => {
    return httpService.get(ENDPOINT);
  };