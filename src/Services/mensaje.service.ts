import type { CreateMensajeDto, MensajeDto } from '../types/dto/mensaje';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/mensajes';

const MensajeService = {

  /**
   * Obtiene todos los mensajes del usuario (Buzón).
   * GET /api/mensajes/
   */
  obtenerMisMensajes: async (): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene la conversación con un usuario específico.
   * GET /api/mensajes/:id_receptor
   */
  obtenerConversacion: async (idReceptor: number): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${idReceptor}`);
  },

  /**
   * Envía un nuevo mensaje.
   * POST /api/mensajes/
   */
  enviarMensaje: async (data: CreateMensajeDto): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Marca un mensaje como leído.
   * PUT /api/mensajes/leido/:id
   */
  marcarComoLeido: async (idMensaje: number): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/leido/${idMensaje}`, {});
  },

  /**
   * Obtiene conteo de no leídos.
   * GET /api/mensajes/no_leidos
   */
  getUnreadCount: async (): Promise<AxiosResponse<{ cantidad: number }>> => {
    // Ajusta el tipo de retorno según tu controller (cantidad, count, total?)
    return await httpService.get(`${BASE_ENDPOINT}/no_leidos`);
  }
};

export default MensajeService;