// src/services/resumenCuenta.service.ts
import httpService from './httpService';

// Importamos los DTOs necesarios
import type {
  ResumenCuentaDTO,
  UserAccountSummaryDTO, // El DTO específico para la vista del usuario
  UpdateResumenCuentaDTO
} from '../types/dto/resumenCuenta.dto.ts';

// La ruta base es /api/resumen-cuentas (según tu index.js)
const ENDPOINT = '/resumen-cuentas';

// --- Funciones para Usuarios ---

/**
 * Obtiene todos los resúmenes de cuenta del usuario logueado.
 * Llama a: GET /api/resumen-cuentas/mis-resumenes
 * (Asumiendo una ruta que usa 'getAccountSummariesByUserId').
 */
export const getMisResumenes = (): Promise<UserAccountSummaryDTO[]> => {
  // El backend usa req.user.id para filtrar
  return httpService.get(`${ENDPOINT}/mis-resumenes`);
};

/**
 * Obtiene un resumen específico por ID (si pertenece al usuario).
 * Llama a: GET /api/resumen-cuentas/:id
 * (Asumiendo que la ruta usa 'findResumenByIdAndUserId').
 */
export const getResumenById = (id: number): Promise<ResumenCuentaDTO | null> => {
  // Usamos el DTO base aquí, ya que no necesita 'proyecto_info' anidado
  return httpService.get(`${ENDPOINT}/${id}`);
};

// --- Funciones para Administradores ---

/**
 * (Admin) Obtiene TODOS los resúmenes de cuenta.
 * Llama a: GET /api/resumen-cuentas
 * (Tu backend usa 'findAll').
 */
export const getAllResumenes = (): Promise<ResumenCuentaDTO[]> => {
  return httpService.get(ENDPOINT);
};

/**
 * (Admin) Actualiza un resumen de cuenta.
 * Llama a: PUT /api/resumen-cuentas/:id
 * (Tu backend usa 'update').
 */
export const updateResumen = (id: number, data: UpdateResumenCuentaDTO): Promise<ResumenCuentaDTO> => {
  // Asumiendo que el backend devuelve el resumen actualizado
  return httpService.put(`${ENDPOINT}/${id}`, data);
};

/**
 * (Admin) Realiza un soft delete de un resumen.
 * Llama a: DELETE /api/resumen-cuentas/:id
 * (Tu backend usa 'softDelete').
 */
export const deleteResumen = (id: number): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${id}`);
};