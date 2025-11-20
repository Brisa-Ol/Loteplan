import type { ConfirmarTransaccionResponse, CreateTransaccionDto, TransaccionDto, UpdateTransaccionDto } from '../types/dto/transaccion.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/transacciones'; // Ajustar según tu router (ej: /api/transacciones)

const TransaccionService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Mis Transacciones)
  // =================================================

  /**
   * Obtiene el historial completo de transacciones del usuario.
   * GET /mis_transacciones
   */
  getMyTransactions: async (): Promise<AxiosResponse<TransaccionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_transacciones`);
  },

  /**
   * Obtiene el detalle de una transacción propia.
   * GET /mis_transacciones/:id
   */
  getMyTransactionById: async (id: number): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_transacciones/${id}`);
  },

  /**
   * Actualiza una transacción propia (si la lógica de negocio lo permite).
   * PUT /mis_transacciones/:id
   */
  updateMyTransaction: async (id: number, data: UpdateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/mis_transacciones/${id}`, data);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (Admin)
  // =================================================

  /**
   * Obtiene TODAS las transacciones del sistema.
   * GET /
   */
  findAll: async (): Promise<AxiosResponse<TransaccionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene una transacción por ID (sin restricción de usuario).
   * GET /:id
   */
  findById: async (id: number): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Crea una transacción manualmente.
   * POST /
   */
  create: async (data: CreateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Actualiza datos de una transacción (Admin).
   * PUT /:id
   */
  update: async (id: number, data: UpdateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Borrado lógico de una transacción.
   * DELETE /:id
   */
  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // ⚡ ACCIONES CRÍTICAS (Admin)
  // =================================================

  /**
   * Fuerza la confirmación de una transacción (ejecuta lógica de negocio asociada).
   * Útil si el webhook falló pero el dinero entró.
   * PUT /:id/confirmar
   */
  forceConfirm: async (id: number): Promise<AxiosResponse<ConfirmarTransaccionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/confirmar`);
  }
};

export default TransaccionService;