import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateCuotaMensualDto, CuotaMensualDto, UpdateCuotaMensualDto } from '../types/dto/cuotaMensual.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const CuotaMensualService = {

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (Admin)
  // =================================================

  /**
   * Crea una cuota y actualiza el monto total del proyecto asociado.
   */
  create: async (data: CreateCuotaMensualDto): Promise<AxiosResponse<CuotaMensualDto>> => {
    return await httpService.post('/cuotas-mensuales', data);
  },

  /**
   * Actualiza valores de la cuota.
   * ⚠️ Esto dispara un recálculo financiero en el backend.
   */
  update: async (id: number, data: UpdateCuotaMensualDto): Promise<AxiosResponse<CuotaMensualDto>> => {
    return await httpService.put(`/cuotas-mensuales/${id}`, data);
  },

  /**
   * Eliminación lógica de la cuota.
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`/cuotas-mensuales/${id}`);
  },

  // =================================================
  // 🔍 CONSULTAS (Usuario / Admin)
  // =================================================

/**
   * Obtiene el historial de todas las cuotas configuradas para un proyecto.
   * ✅ CAMBIO: Agregamos '/proyecto/' a la ruta para evitar conflicto con getById
   */
  getByProjectId: async (idProyecto: number): Promise<AxiosResponse<CuotaMensualDto[]>> => {
    // Antes: return await httpService.get(`/cuotas-mensuales/${idProyecto}`);
    // Ahora:
    return await httpService.get(`/cuotas-mensuales/proyecto/${idProyecto}`);
  },

  /**
   * Obtiene la ÚLTIMA cuota activa.
   */
  getLastByProjectId: async (idProyecto: number): Promise<AxiosResponse<CuotaMensualDto>> => {
    return await httpService.get(`/cuotas-mensuales/proyecto/${idProyecto}/last`); // Recomendado estandarizar esta también
  }
};

export default CuotaMensualService;