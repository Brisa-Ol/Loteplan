import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { AsignarLotesDto, CompletionRateDTO, CreateProyectoDto, MonthlyProgressItem, ProyectoDto, UpdateProyectoDto } from "@/core/types/dto/proyecto.dto";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";

const BASE_ENDPOINT = '/proyectos';

const ProyectoService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================

  getAllActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  getAhorristasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos/ahorristas`);
  },

  getInversionistasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos/inversionistas`);
  },

  getMyProjects: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis-proyectos`);
  },

  getByIdActive: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Crea un nuevo proyecto.
   * ✅ ADAPTADO: Envía JSON puro para que 'req.body' no sea undefined.
   * ✅ ADAPTADO: Incluye 'lotesIds' vacío para evitar errores de destructuración.
   */
  create: async (data: CreateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    // Al enviar el objeto directamente, Axios pone automáticamente 
    // el header 'Content-Type: application/json'
    return await httpService.post(BASE_ENDPOINT, {
      ...data,
      lotesIds: [] // Aseguramos que el back encuentre esta propiedad al hacer destructuring
    });
  },

  /**
   * Actualiza datos básicos.
   */
  update: async (id: number, data: UpdateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Asigna lotes a un proyecto existente (Operación transaccional en el back).
   */
  assignLotes: async (idProyecto: number, lotesIds: number[]): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    const data: AsignarLotesDto = { lotesIds };
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/lotes`, data);
  },

  /**
   * Inicia el proceso de cobros para proyectos mensuales.
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
  // 📊 MÉTRICAS (KPIs) - ADMIN
  // =================================================

  getCompletionRate: async (): Promise<CompletionRateDTO> => {
    const { data } = await httpService.get<{ mensaje: string, data: CompletionRateDTO }>(`${BASE_ENDPOINT}/metricas/culminacion`);
    return data.data;
  },

  getMonthlyProgress: async (): Promise<MonthlyProgressItem[]> => {
    const { data } = await httpService.get<{ mensaje: string, data: MonthlyProgressItem[] }>(`${BASE_ENDPOINT}/metricas/avance-mensual`);
    return data.data;
  }
};

export default ProyectoService;