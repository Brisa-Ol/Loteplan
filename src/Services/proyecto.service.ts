// src/services/proyecto.service.ts
import type { AsignarLotesDto, CreateProyectoDto, MetricasAvanceMensualDto, MetricasCulminacionDto, ProyectoDTO, ProyectoUpdateDTO } from '../types/dto/proyecto.dto';
import httpService from './httpService';


/**
 * Servicio para gestionar operaciones relacionadas con Proyectos
 */
export const proyectoService = {
  /**
   * 🟢 USUARIOS: Obtiene todos los proyectos activos
   */
  async getProyectosActivos(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>('/proyectos/activos');
    return data;
  },

  /**
   * 🟢 USUARIOS: Obtiene proyectos activos tipo "mensual" (Ahorristas)
   */
  async getProyectosAhorristas(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>('/proyectos/activos/ahorristas');
    return data;
  },

  /**
   * 🟢 USUARIOS: Obtiene proyectos activos tipo "directo" (Inversionistas)
   */
  async getProyectosInversionistas(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>('/proyectos/activos/inversionistas');
    return data;
  },

  /**
   * 🟢 USUARIOS: Obtiene mis proyectos (en los que he invertido)
   */
  async getMisProyectos(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>('/proyectos/mis-proyectos');
    return data;
  },

  /**
   * 🟢 USUARIOS: Obtiene un proyecto activo por ID
   */
  async getProyectoActivoById(id: number): Promise<ProyectoDTO> {
    const { data } = await httpService.get<ProyectoDTO>(`/proyectos/${id}/activo`);
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene todos los proyectos (activos e inactivos)
   */
  async getAllProyectos(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>('/proyectos');
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene un proyecto por ID (sin filtro de activo)
   */
  async getProyectoById(id: number): Promise<ProyectoDTO> {
    const { data } = await httpService.get<ProyectoDTO>(`/proyectos/${id}`);
    return data;
  },

  /**
   * 🔴 ADMIN: Crea un nuevo proyecto
   */
  async createProyecto(proyectoData: CreateProyectoDto): Promise<ProyectoDTO> {
    const { data } = await httpService.post<ProyectoDTO>('/proyectos', proyectoData);
    return data;
  },

  /**
   * 🔴 ADMIN: Actualiza un proyecto existente
   */
  async updateProyecto(id: number, proyectoData: ProyectoUpdateDTO): Promise<ProyectoUpdateDTO> {
    const { data } = await httpService.put<ProyectoUpdateDTO>(`/proyectos/${id}`, proyectoData);
    return data;
  },

  /**
   * 🔴 ADMIN: Elimina un proyecto (soft delete)
   */
  async deleteProyecto(id: number): Promise<{ message: string }> {
    const { data } = await httpService.delete<{ message: string }>(`/proyectos/${id}`);
    return data;
  },

  /**
   * 🔴 ADMIN: Asigna lotes a un proyecto existente
   */
  async asignarLotes(id: number, lotesData: AsignarLotesDto): Promise<ProyectoDTO> {
    const { data } = await httpService.put<ProyectoDTO>(`/proyectos/${id}/lotes`, lotesData);
    return data;
  },

  /**
   * 🔴 ADMIN: Inicia el proceso de un proyecto mensual
   */
  async iniciarProceso(id: number): Promise<ProyectoDTO> {
    const { data } = await httpService.put<ProyectoDTO>(`/proyectos/${id}/iniciar-proceso`);
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene métricas de tasa de culminación (KPI 4)
   */
  async getMetricasCulminacion(): Promise<MetricasCulminacionDto> {
    const { data } = await httpService.get<MetricasCulminacionDto>('/proyectos/metricas/culminacion');
    return data;
  },

  /**
   * 🔴 ADMIN: Obtiene métricas de avance mensual de suscripciones (KPI 5)
   */
  async getMetricasAvanceMensual(): Promise<MetricasAvanceMensualDto> {
    const { data } = await httpService.get<MetricasAvanceMensualDto>('/proyectos/metricas/avance-mensual');
    return data;
  }
};