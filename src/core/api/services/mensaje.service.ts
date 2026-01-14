
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import type { CreateMensajeDto, MensajeDto } from '@/core/types/dto/mensaje';


const BASE_ENDPOINT = '/mensajes';
/**
 * Servicio para la gestión de mensajería entre usuarios.
 * Conecta con el controlador `mensajeController` del backend.

 * @remarks
 * - Los mensajes permiten comunicación entre usuarios
 * - El sistema notifica cuando hay mensajes nuevos
 * - Los mensajes pueden marcarse como leídos
 * - El backend rastrea el conteo de mensajes no leídos
 */
const MensajeService = {

  /**
   * Obtiene todos los mensajes del usuario autenticado (buzón de entrada).
   * 
   * @returns Lista de mensajes recibidos por el usuario
   * 
   * @remarks
   * Backend: GET /api/mensajes/
   * - Requiere autenticación
   * - Retorna mensajes donde el usuario es receptor
   * - Incluye información del remitente
   * - Ordenados por fecha (más recientes primero)
   * 
   */
  obtenerMisMensajes: async (): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
 * Obtiene la conversación completa con un usuario específico.
   * 
   * @param idReceptor - ID del usuario con quien se tiene la conversación
   * @returns Lista de mensajes de la conversación
   * 
   * @remarks
   * Backend: GET /api/mensajes/:id_receptor
   * - Requiere autenticación
   * - Retorna mensajes bidireccionales (enviados y recibidos)
   * - Incluye todos los mensajes entre el usuario actual y el receptor
   * - Útil para mostrar un chat completo
   * 
   */
  obtenerConversacion: async (idReceptor: number): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${idReceptor}`);
  },

  /**
   * Envía un nuevo mensaje a otro usuario.
   * 
   * @param data - Datos del mensaje (id_receptor, contenido)
   * @returns Mensaje enviado
   * 
   * @remarks
   * Backend: POST /api/mensajes/
   * - Requiere autenticación
   * - El id_remitente se toma del token de autenticación
   * - Crea el mensaje y notifica al receptor
   * - El mensaje se marca como no leído para el receptor
   * 
   */
  enviarMensaje: async (data: CreateMensajeDto): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
  * Marca un mensaje como leído.
   * 
   * @param idMensaje - ID del mensaje a marcar como leído
   * @returns Mensaje actualizado
   * 
   * @remarks
   * Backend: PUT /api/mensajes/leido/:id
   * - Requiere autenticación
   * - Solo el receptor puede marcar el mensaje como leído
   * - Actualiza el campo `leido` a true
   * - Reduce el conteo de mensajes no leídos
   * 
   */
  marcarComoLeido: async (idMensaje: number): Promise<AxiosResponse<MensajeDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/leido/${idMensaje}`, {});
  },

  /**
 * Obtiene el conteo de mensajes no leídos del usuario.
   * 
   * @returns Objeto con la cantidad de mensajes no leídos
   * 
   * @remarks
   * Backend: GET /api/mensajes/no_leidos
   * - Requiere autenticación
   * - Retorna el número total de mensajes no leídos
   * - Útil para mostrar badge de notificaciones
   * - Se actualiza cuando se marca un mensaje como leído
   * 
   */
  getUnreadCount: async (): Promise<AxiosResponse<{ cantidad: number }>> => {
    // Ajusta el tipo de retorno según tu controller (cantidad, count, total?)
    return await httpService.get(`${BASE_ENDPOINT}/no_leidos`);
  },
   /**
   * Obtiene todos los mensajes del sistema (Solo Admin).
   */
  getAllAdmin: async (): Promise<AxiosResponse<MensajeDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin`);
  }
};

export default MensajeService;