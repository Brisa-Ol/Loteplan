// src/services/proyecto.service.ts (CORREGIDO Y OPTIMIZADO)
import httpService from './httpService';
import type {
  ProyectoDTO,
  CreateProyectoDTO,
  UpdateProyectoDTO,
  AssignLotesDTO
} from '../types/dto/proyecto.dto';

// La ruta base es /api/proyectos
const ENDPOINT = '/proyectos';

// --- Funciones para Usuarios ---

/**
 * Obtiene TODOS los proyectos ACTIVOS (para mostrar en la web).
 * Llama a: GET /api/proyectos/activos
 */
export const getAllActiveProyectos = (): Promise<ProyectoDTO[]> => {
  return httpService.get(`${ENDPOINT}/activos`);
};

/**
 * ❗ NUEVO (Optimización)
 * Obtiene solo los proyectos ACTIVOS para Ahorristas (mensual).
 * Llama a: GET /api/proyectos/activos/ahorristas
 */
export const getProyectosDeAhorristas = (): Promise<ProyectoDTO[]> => {
  return httpService.get(`${ENDPOINT}/activos/ahorristas`);
};

/**
 * ❗ NUEVO (Optimización)
 * Obtiene solo los proyectos ACTIVOS para Inversionistas (directo).
 * Llama a: GET /api/proyectos/activos/inversionistas
 */
export const getProyectosDeInversion = (): Promise<ProyectoDTO[]> => {
  return httpService.get(`${ENDPOINT}/activos/inversionistas`);
};


/**
 * Obtiene un proyecto ACTIVO específico por ID (para ver detalles).
 * ❗ CORRECCIÓN: La ruta pública en tu backend es /:id/activo
 * Llama a: GET /api/proyectos/:id/activo
 */
export const getActiveProyectoById = (id: number): Promise<ProyectoDTO> => {
  return httpService.get(`${ENDPOINT}/${id}/activo`);
};

/**
 * Obtiene los proyectos en los que el usuario ha invertido o está suscripto.
 * ❗ CORRECCIÓN: El nombre de la función y la ruta se ajustaron al backend.
 * Llama a: GET /api/proyectos/mis-proyectos
 */
export const getMisProyectos = (): Promise<ProyectoDTO[]> => {
  // Tu backend usa /mis-proyectos, no /mis-inversiones
  return httpService.get(`${ENDPOINT}/mis-proyectos`);
};

// --- Funciones para Administradores ---

/**
 * (Admin) Crea un nuevo proyecto.
 * Llama a: POST /api/proyectos
 */
export const createProyecto = (data: CreateProyectoDTO): Promise<ProyectoDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * (Admin) Actualiza los datos de un proyecto.
 * Llama a: PUT /api/proyectos/:id
 */
export const updateProyecto = (id: number, data: UpdateProyectoDTO): Promise<ProyectoDTO> => {
  return httpService.put(`${ENDPOINT}/${id}`, data);
};

/**
 * (Admin) Asigna lotes a un proyecto existente.
 * ❗ CORRECCIÓN: Tu backend usa el método PUT y la ruta /:id/lotes
 * Llama a: PUT /api/proyectos/:id/lotes
 */
export const assignLotesToProyecto = (id: number, data: AssignLotesDTO): Promise<ProyectoDTO> => {
  // Tu backend espera PUT, no POST, y en la ruta /lotes
  return httpService.put(`${ENDPOINT}/${id}/lotes`, data);
};

/**
 * (Admin) Realiza un soft delete de un proyecto.
 * Llama a: DELETE /api/proyectos/:id
 */
export const deleteProyecto = (id: number): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${id}`);
};