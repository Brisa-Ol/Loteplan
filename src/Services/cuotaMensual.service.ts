import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateCuotaMensualDto, CuotaMensualDto, UpdateCuotaMensualDto } from '../types/dto/cuotaMensual.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


  /**
   * Servicio para la gestión de cuotas mensuales de proyectos.
   * Conecta con el controlador `cuotaMensualController` del backend.
   *  @remarks
 * - Las cuotas mensuales definen el monto y cronograma de pagos para proyectos mensuales
 * - Al crear/actualizar una cuota, el backend recalcula el monto total del proyecto
 * - Solo aplica a proyectos con tipo_inversion: 'mensual'
 * - Soft delete: activo: true/false
   */
  
const CuotaMensualService = {

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (Admin)
  // =================================================
/**
 * crea una nueva cuota mensual para un proyecto.
 * @param data- Data de la cuota 
 * @returns cuota creada
 */
  create: async (data: CreateCuotaMensualDto): Promise<AxiosResponse<CuotaMensualDto>> => {
    return await httpService.post('/cuotas-mensuales', data);
  },

  /**
  * Actualiza una cuota mensual existente.
  * @param id - ID de la cuota
  * @param data - Datos a actualizar
  * @returns Cuota actualizada
  */
  update: async (id: number, data: UpdateCuotaMensualDto): Promise<AxiosResponse<CuotaMensualDto>> => {
    return await httpService.put(`/cuotas-mensuales/${id}`, data);
  },

  /**
   * Desactiva una cuota mensual (soft delete - solo administradores).
   * @param id - ID de la cuota a desactivar
   * @returns Mensaje de confirmación
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`/cuotas-mensuales/${id}`);
  },

  // =================================================
  // 🔍 CONSULTAS (Usuario / Admin)
  // =================================================

/**
   * Obtiene el historial de todas las cuotas configuradas para un proyecto.
   * @param idProyecto - ID del proyecto
   * @returns Lista de cuotas del proyecto
   */
  getByProjectId: async (idProyecto: number): Promise<AxiosResponse<CuotaMensualDto[]>> => {

    return await httpService.get(`/cuotas-mensuales/proyecto/${idProyecto}`);
  },

  /**
  * Obtiene la última cuota activa de un proyecto.
   * @param idProyecto - ID del proyecto
   * @returns Última cuota activa
   */
  getLastByProjectId: async (idProyecto: number): Promise<AxiosResponse<CuotaMensualDto>> => {
    return await httpService.get(`/cuotas-mensuales/proyecto/${idProyecto}/last`); // Recomendado estandarizar esta también
  }
};

export default CuotaMensualService;