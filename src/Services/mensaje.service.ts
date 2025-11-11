// src/services/mensaje.service.ts
import type { CreateMensajeDTO, MensajeDTO } from '../types/dto/mensaje';
import httpService from './httpService';

// Importamos los DTOs de entrada y salida


// La ruta base es /api/mensajes (según tu index.js)
const ENDPOINT = '/mensajes';

/**
 * Obtiene la conversación con otro usuario.
 * Llama a: GET /api/mensajes/conversacion/:otroUsuarioId
 * (Asumiendo una ruta en tu backend que usa 'obtenerConversacion'
 * y toma el 'userId1' del req.user.id).
 */
export const getConversacionCon = (otroUsuarioId: number): Promise<MensajeDTO[]> => {
  return httpService.get(`${ENDPOINT}/conversacion/${otroUsuarioId}`);
};

/**
 * Envía un nuevo mensaje.
 * Llama a: POST /api/mensajes
 * (Tu backend usa 'crear').
 */
export const enviarMensaje = (data: CreateMensajeDTO): Promise<MensajeDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * Obtiene el conteo de mensajes no leídos para el usuario logueado.
 * Llama a: GET /api/mensajes/no-leidos
 * (Tu backend usa 'contarNoLeidos').
 */
export const getMensajesNoLeidos = (): Promise<{ count: number }> => {
  return httpService.get(`${ENDPOINT}/no-leidos`);
};

/**
 * Marca un mensaje como leído.
 * Llama a: PUT /api/mensajes/:mensajeId/leido
 * (Tu backend usa 'marcarComoLeido').
 */
export const marcarComoLeido = (mensajeId: number): Promise<MensajeDTO> => {
  return httpService.put(`${ENDPOINT}/${mensajeId}/leido`, {});
};