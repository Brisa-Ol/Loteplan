// src/services/suscripcion.service.ts
import httpService from './httpService';

// Importamos los DTOs que vamos a recibir
import type { SuscripcionProyectoDTO } from '../types/dto/suscripcionProyecto.dto';
import type { SuscripcionCanceladaDTO } from '../types/dto/suscripcionCancelada.dto';
import type { PagoDTO } from '../types/dto/pago.dto';

// La ruta base es /api/suscripciones (o como la llames en tu index.js)
const ENDPOINT = '/suscripciones';

// --- Funciones para Usuarios ---

/**
 * DTO DE ENTRADA para crear una nueva suscripción
 */
export interface CreateSuscripcionDTO {
  id_proyecto: number;
}

/**
 * DTO DE SALIDA al crear una suscripción (incluye la primera cuota)
 */
export interface CreateSuscripcionResponseDTO {
  suscripcion: SuscripcionProyectoDTO;
  primerPago: PagoDTO; // La cuota 1 que se crea automáticamente
}

/**
 * 🆕 FUNCIÓN CLAVE: Crea una nueva suscripción mensual a un proyecto.
 * Esto debería crear automáticamente la primera cuota (Pago).
 * Llama a: POST /api/suscripciones
 */
export const crearSuscripcion = (data: CreateSuscripcionDTO): Promise<CreateSuscripcionResponseDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * Obtiene las suscripciones ACTIVAS del usuario logueado.
 * Llama a: GET /api/suscripciones/mis-suscripciones
 */
export const getMisSuscripcionesActivas = (): Promise<SuscripcionProyectoDTO[]> => {
  return httpService.get(`${ENDPOINT}/mis-suscripciones`);
};

/**
 * 💥 ACCIÓN CLAVE: Cancela una suscripción activa (soft delete).
 * Llama a: DELETE /api/suscripciones/:id
 */
export const cancelarSuscripcion = (suscripcionId: number): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${suscripcionId}`);
};

/**
 * Obtiene el historial de suscripciones CANCELADAS del usuario logueado.
 * Llama a: GET /api/suscripciones/canceladas/mis-suscripciones
 */
export const getMisSuscripcionesCanceladas = (): Promise<SuscripcionCanceladaDTO[]> => {
  return httpService.get(`${ENDPOINT}/canceladas/mis-suscripciones`);
};

// --- Funciones para Administradores ---

/**
 * (Admin) Obtiene TODAS las suscripciones canceladas.
 * Llama a: GET /api/suscripciones/canceladas
 */
export const getAllSuscripcionesCanceladas = (): Promise<SuscripcionCanceladaDTO[]> => {
  return httpService.get(`${ENDPOINT}/canceladas`);
};

/**
 * (Admin) Obtiene las suscripciones canceladas para un proyecto específico.
 * Llama a: GET /api/suscripciones/canceladas/proyecto/:proyectoId
 */
export const getCanceladasPorProyecto = (proyectoId: number): Promise<SuscripcionCanceladaDTO[]> => {
  return httpService.get(`${ENDPOINT}/canceladas/proyecto/${proyectoId}`);
};