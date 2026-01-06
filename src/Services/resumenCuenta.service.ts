// src/services/resumenCuenta.service.ts
import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { ResumenCuentaDto, UpdateResumenCuentaDto } from '../types/dto/resumenCuenta.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/resumen-cuentas'; 

/**
 * Servicio para la gestión de resúmenes de cuenta.
 * Los errores HTTP son manejados automáticamente por el interceptor global.
 */
const ResumenCuentaService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Mis Resúmenes)
  // =================================================

  /**
   * Obtiene todos los resúmenes de cuenta del usuario autenticado.
   */
  getMyAccountSummaries: async (): Promise<AxiosResponse<ResumenCuentaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_resumenes`);
  },

  /**
   * Obtiene un resumen específico por ID (validando propiedad).
   */
  getById: async (id: number): Promise<AxiosResponse<ResumenCuentaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todos los resúmenes de cuenta del sistema (solo administradores).
   */
  findAll: async (): Promise<AxiosResponse<ResumenCuentaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Actualiza manualmente un resumen de cuenta (solo administradores).
   */
  update: async (id: number, data: UpdateResumenCuentaDto): Promise<AxiosResponse<ResumenCuentaDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Desactiva un resumen de cuenta (soft delete - solo administradores).
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default ResumenCuentaService;