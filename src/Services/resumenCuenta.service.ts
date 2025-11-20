import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { ResumenCuentaDto, UpdateResumenCuentaDto } from '../types/dto/resumenCuenta.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/resumenes-cuenta'; // Ajustar según app.js (ej: /api/resumenes_cuenta)

const ResumenCuentaService = {

  // =================================================
  // 👤 GESTIÓN USUARIO (Mis Resúmenes)
  // =================================================

  /**
   * Obtiene todos los resúmenes de cuenta del usuario autenticado.
   * GET /mis_resumenes
   */
  getMyAccountSummaries: async (): Promise<AxiosResponse<ResumenCuentaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_resumenes`);
  },

  /**
   * Obtiene un resumen específico por ID (validando propiedad).
   * GET /:id
   */
  getById: async (id: number): Promise<AxiosResponse<ResumenCuentaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (Admin)
  // =================================================

  /**
   * Obtiene TODOS los resúmenes del sistema.
   * GET /
   */
  findAll: async (): Promise<AxiosResponse<ResumenCuentaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Actualiza manualmente un resumen (corrección de datos).
   * PUT /:id
   */
  update: async (id: number, data: UpdateResumenCuentaDto): Promise<AxiosResponse<ResumenCuentaDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Borrado lógico.
   * DELETE /:id
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default ResumenCuentaService;