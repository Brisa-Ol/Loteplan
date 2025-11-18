// src/services/cuotaMensual.service.ts
import httpService from './httpService';
import type { CuotaMensualDTO, CreateCuotaMensualDTO } from '../types/dto/cuotaMensual.dto';

// ❗ Tu ruta de backend es '/cuota_mensual'
const ENDPOINT = '/cuota_mensual'; 

const cuotaMensualService = {
  /**
   * (Admin) Crea una nueva cuota mensual para un proyecto.
   * Llama a: POST /api/cuota_mensual
   */
  async createCuota(cuotaData: CreateCuotaMensualDTO): Promise<CuotaMensualDTO> {
    const { data } = await httpService.post<CuotaMensualDTO>(ENDPOINT, cuotaData);
    return data;
  },

  /**
   * (Admin) Actualiza una cuota mensual.
   * Llama a: PUT /api/cuota_mensual/:id
   */
  async updateCuota(id: string, cuotaData: Partial<CreateCuotaMensualDTO>): Promise<CuotaMensualDTO> {
    const { data } = await httpService.put<CuotaMensualDTO>(`${ENDPOINT}/${id}`, cuotaData);
    return data;
  },

  /**
   * (Usuario/Admin) Obtiene todas las cuotas de un proyecto.
   * Llama a: GET /api/cuota_mensual/:id_proyecto
   */
  async getCuotasByProyecto(idProyecto: string | number): Promise<CuotaMensualDTO[]> {
    const { data } = await httpService.get<CuotaMensualDTO[]>(`${ENDPOINT}/${idProyecto}`);
    return data;
  },

  /**
   * (Usuario/Admin) Obtiene la última cuota de un proyecto.
   * Llama a: GET /api/cuota_mensual/:id_proyecto/last
   */
  async getLastCuotaByProyecto(idProyecto: string | number): Promise<CuotaMensualDTO> {
    const { data } = await httpService.get<CuotaMensualDTO>(`${ENDPOINT}/${idProyecto}/last`);
    return data;
  },

  /**
   * (Admin) Elimina (soft delete) una cuota.
   * Llama a: DELETE /api/cuota_mensual/:id
   */
  async deleteCuota(id: string | number): Promise<{ mensaje: string }> {
    const { data } = await httpService.delete<{ mensaje: string }>(`${ENDPOINT}/${id}`);
    return data;
  },
};

export { cuotaMensualService };