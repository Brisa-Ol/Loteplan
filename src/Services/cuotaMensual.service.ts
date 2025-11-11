// src/services/cuotaMensual.service.ts (CORREGIDO - RUTA SIMPLIFICADA)
import httpService from './httpService';
import type {
  CuotaMensualDTO,
  CreateCuotaMensualDTO,
  UpdateCuotaMensualDTO
} from '../types/dto/cuotaMensual.dto';

const ENDPOINT = '/cuotas_mensuales';

export const createCuota = (data: CreateCuotaMensualDTO): Promise<CuotaMensualDTO> => {
  return httpService.post(ENDPOINT, data);
};

export const updateCuota = (id: number, data: UpdateCuotaMensualDTO): Promise<CuotaMensualDTO> => {
  return httpService.put(`${ENDPOINT}/${id}`, data);
};
 /**
  * Llama a: GET /api/cuotas_mensuales/:id_proyecto
  * Esta función llama a GET /api/cuotas_mensuales/proyecto/:id_proyecto
 */
export const getCuotasByProyectoId = (id_proyecto: number): Promise<CuotaMensualDTO[]> => {

  return httpService.get(`${ENDPOINT}/${id_proyecto}`);
};
/**
 * Obtiene la ÚLTIMA cuota de un proyecto (basado en tus rutas del backend).
 * Llama a: GET /api/cuotas_mensuales/:id_proyecto/last
 */
export const getLatestCuotaByProyectoId = (id_proyecto: number): Promise<CuotaMensualDTO> => {
  return httpService.get(`${ENDPOINT}/${id_proyecto}/last`);
};

export const deleteCuota = (id: number): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${id}`);
};