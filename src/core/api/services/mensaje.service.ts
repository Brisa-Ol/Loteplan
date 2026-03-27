import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import type { CreateMensajeDto, MensajeDto, ConteoNoLeidosDto } from '@/core/types/mensaje';

const BASE_ENDPOINT = '/mensajes';

const MensajeService = {
  obtenerMisMensajes: async (): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  obtenerConversacion: async (idReceptor: number): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${idReceptor}`);
  },

  enviarMensaje: async (data: CreateMensajeDto): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  marcarComoLeido: async (idMensaje: number): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/leido/${idMensaje}`, {});
  },

  // FIX #2: El tipo de retorno ahora usa ConteoNoLeidosDto con el campo `conteo`,
  // que es exactamente lo que devuelve el backend: res.status(200).json({ conteo }).
  // Antes estaba tipado como { cantidad: number }, que nunca coincidía.
  getUnreadCount: async (): Promise<AxiosResponse<ConteoNoLeidosDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/no_leidos`);
  },

  getAllAdmin: async (): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin`);
  }
};

export default MensajeService;