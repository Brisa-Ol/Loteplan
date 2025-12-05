import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  TransaccionDto, 
  CreateTransaccionDto, 
  UpdateTransaccionDto, 
  ConfirmarTransaccionResponse 
} from '../types/dto/transaccion.dto';

const BASE_ENDPOINT = '/transacciones';

const TransaccionService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Mis Transacciones)
  // =================================================

  /**
   * Obtiene el historial completo de transacciones del usuario.
   * El backend ahora incluye: proyectoTransaccion, pagoMensual, etc.
   */
  getMyTransactions: async (): Promise<AxiosResponse<TransaccionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_transacciones`);
  },

  getMyTransactionById: async (id: number): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_transacciones/${id}`);
  },

  updateMyTransaction: async (id: number, data: UpdateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/mis_transacciones/${id}`, data);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (Admin)
  // =================================================

  /**
   * Obtiene TODAS las transacciones con todos los detalles relacionados (includes).
   */
  findAll: async (): Promise<AxiosResponse<TransaccionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findById: async (id: number): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  create: async (data: CreateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  update: async (id: number, data: UpdateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // ⚡ ACCIONES CRÍTICAS
  // =================================================

  forceConfirm: async (id: number): Promise<AxiosResponse<ConfirmarTransaccionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/confirmar`);
  }
};

export default TransaccionService;