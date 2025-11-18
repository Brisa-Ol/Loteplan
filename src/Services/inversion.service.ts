// src/services/inversion.service.ts (CORREGIDO)
import httpService from './httpService';
import type { InversionDTO, CreateInversionDTO,InversionCreadaResponseDTO} from '../types/dto/inversion.dto';

// La ruta base es /api/inversiones (según tu index.js)
const ENDPOINT = '/inversiones';

export const crearInversion = (data: CreateInversionDTO): Promise<InversionCreadaResponseDTO> => {
  return httpService.post(ENDPOINT, data);
};
/**
 * Obtiene todas las inversiones del usuario logueado.
 * Llama a: GET /api/inversiones/mis-inversiones
 * (Asumiendo una ruta que usa 'findByUserId').
 */
export const getMisInversiones = (): Promise<InversionDTO[]> => {
  // El backend usa req.user.id para filtrar
  return httpService.get(`${ENDPOINT}/mis-inversiones`);
};

/**
 * Obtiene una inversión específica por su ID.
 * Llama a: GET /api/inversiones/:id
 */
export const getInversionById = (id: number): Promise<InversionDTO> => {
  return httpService.get(`${ENDPOINT}/${id}`);
};

/**
 * 🔴 ADMIN: Obtiene métricas de liquidez
 * Llama a: GET /api/inversiones/metricas/liquidez
 */
export const getMetricasLiquidez = async () => {
  const { data } = await httpService.get(`${ENDPOINT}/metricas/liquidez`);
  return data;
};

/**
 * 🔴 ADMIN: Obtiene inversión agregada por usuario
 * Llama a: GET /api/inversiones/metricas/agregado-por-usuario
 */
export const getInversionAgregadaPorUsuario = async () => {
  const { data } = await httpService.get(`${ENDPOINT}/metricas/agregado-por-usuario`);
  return data;
};