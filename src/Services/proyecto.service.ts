import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { AsignarLotesDto, CompletionRateDto, CreateProyectoDto, MonthlyProgressItemDto, ProyectoDto, UpdateProyectoDto } from '../types/dto/proyecto.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/proyectos'; // Asume prefijo en router

const ProyectoService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================

  /**
   * Obtiene TODOS los proyectos activos.
   */
  getAllActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  /**
   * Obtiene solo proyectos tipo 'mensual' (Ahorristas).
   */
  getAhorristasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos/ahorristas`);
  },

  /**
   * Obtiene solo proyectos tipo 'directo' (Inversionistas).
   */
  getInversionistasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos/inversionistas`);
  },

  /**
   * Obtiene "Mis Proyectos" (donde el usuario invirtió o se suscribió).
   */
  getMyProjects: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis-proyectos`);
  },

  /**
   * Detalle de un proyecto activo (Validación de seguridad backend).
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Crea un proyecto y dispara notificaciones masivas.
   * ⚠️ Puede tardar unos segundos debido al envío de mensajes.
   */
  create: async (data: CreateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  update: async (id: number, data: UpdateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Asigna lotes a un proyecto existente.
   */
  assignLotes: async (idProyecto: number, lotesIds: number[]): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    const data: AsignarLotesDto = { lotesIds };
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/lotes`, data);
  },

  /**
   * Inicia el conteo de meses (Cambia estado a "En proceso").
   */
  startProcess: async (idProyecto: number): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/iniciar-proceso`);
  },

  getAllAdmin: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  getByIdAdmin: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 📊 MÉTRICAS (KPIs)
  // =================================================

  /**
   * KPI 4: Tasa de Culminación.
   */
  getCompletionRateMetrics: async (): Promise<AxiosResponse<{ mensaje: string, data: CompletionRateDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/culminacion`);
  },

  /**
   * KPI 5: Avance Mensual de Suscripciones.
   */
  getMonthlyProgressMetrics: async (): Promise<AxiosResponse<{ mensaje: string, data: MonthlyProgressItemDto[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/avance-mensual`);
  }
};

export default ProyectoService;