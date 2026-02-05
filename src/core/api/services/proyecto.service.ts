import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { 
  AsignarLotesDto, 
  CompletionRateDTO, 
  CreateProyectoDto, 
  MonthlyProgressItem, 
  ProyectoDto, 
  UpdateProyectoDto 
} from "@/core/types/dto/proyecto.dto";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";

const BASE_ENDPOINT = '/proyectos';

const ProyectoService = {

  // =================================================
  // 👁️ VISTA PÚBLICA (No requieren Token)
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

  /**
   * ✅ Acceso público al detalle
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // 🔒 VISTA PRIVADA (Requieren Token)
  // =================================================

  getMyProjects: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis-proyectos`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  create: async (data: CreateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.post(BASE_ENDPOINT, {
      ...data,
      lotesIds: [] 
    });
  },

  update: async (id: number, data: UpdateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  assignLotes: async (idProyecto: number, lotesIds: number[]): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    const data: AsignarLotesDto = { lotesIds };
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/lotes`, data);
  },

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