import { SYSTEM_USER_ID, type ConteoNoLeidosResponse, type EnviarMensajeDto, type MensajeDto } from '../types/dto/mensaje';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/mensajes'; // Ajusta según tu app.js (ej: /api/mensajes)

const MensajeService = {

  // =================================================
  // 📨 BANDEJA DE ENTRADA / GENERAL
  // =================================================

  /**
   * Obtiene todos los mensajes (enviados y recibidos) del usuario.
   * Útil para armar la lista de "Conversaciones recientes".
   */
  getAllMyMessages: async (): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene el número de mensajes sin leer.
   * Ideal para poner un "Badge" rojo en el icono de notificaciones del Navbar.
   */
  getUnreadCount: async (): Promise<AxiosResponse<ConteoNoLeidosResponse>> => {
    return await httpService.get(`${BASE_ENDPOINT}/no_leidos`);
  },

  // =================================================
  // 💬 CONVERSACIÓN Y DETALLE
  // =================================================

  /**
   * Obtiene el historial de chat con un usuario específico.
   */
  getConversation: async (idReceptor: number): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${idReceptor}`);
  },

  /**
   * Envía un nuevo mensaje.
   */
  send: async (data: EnviarMensajeDto): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Marca un mensaje específico como leído.
   * Se debe llamar cuando el mensaje aparece en pantalla (viewport).
   */
  markAsRead: async (idMensaje: number): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/leido/${idMensaje}`);
  },

  // =================================================
  // 🛠️ HELPERS DE UTILIDAD
  // =================================================

  /**
   * Determina si un mensaje es una notificación del sistema.
   */
  isSystemMessage: (mensaje: MensajeDto): boolean => {
    return mensaje.id_remitente === SYSTEM_USER_ID;
  }
};

export default MensajeService;