// src/core/api/services/proyecto.service.ts

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

/**
 * Helper para asegurar que los campos calculados del backend (valor_cuota_referencia, etc.)
 * sean tratados como números si vienen como strings de la DB.
 */
const mapProyectoData = (proyecto: ProyectoDto): ProyectoDto => ({
  ...proyecto,
  monto_inversion: Number(proyecto.monto_inversion),
  valor_cuota_referencia: proyecto.valor_cuota_referencia ? Number(proyecto.valor_cuota_referencia) : undefined,
  valor_cemento: proyecto.valor_cemento ? Number(proyecto.valor_cemento) : undefined,
});

const ProyectoService = {

  // =================================================
  // 👁️ VISTA PÚBLICA (No requieren Token)
  // =================================================

  getAllActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    const res = await httpService.get<ProyectoDto[]>(`${BASE_ENDPOINT}/activos`);
    return { ...res, data: res.data.map(mapProyectoData) };
  },

  getAhorristasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    const res = await httpService.get<ProyectoDto[]>(`${BASE_ENDPOINT}/activos/ahorristas`);
    return { ...res, data: res.data.map(mapProyectoData) };
  },

  getInversionistasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    const res = await httpService.get<ProyectoDto[]>(`${BASE_ENDPOINT}/activos/inversionistas`);
    return { ...res, data: res.data.map(mapProyectoData) };
  },

  getByIdActive: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    const res = await httpService.get<ProyectoDto>(`${BASE_ENDPOINT}/${id}/activo`);
    return { ...res, data: mapProyectoData(res.data) };
  },

  // =================================================
  // 🔒 VISTA PRIVADA (Requieren Token)
  // =================================================

  getMyProjects: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    const res = await httpService.get<ProyectoDto[]>(`${BASE_ENDPOINT}/mis-proyectos`);
    return { ...res, data: res.data.map(mapProyectoData) };
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  create: async (data: CreateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    // Al crear, forzamos que lotes sea un array vacío si no se provee
    return await httpService.post(BASE_ENDPOINT, {
      ...data,
      lotesIds: data.lotesIds || [] 
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

  revertProcess: async (idProyecto: number): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/revertir-proceso`);
  },

  getAllAdmin: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    const res = await httpService.get<ProyectoDto[]>(BASE_ENDPOINT);
    return { ...res, data: res.data.map(mapProyectoData) };
  },

  getByIdAdmin: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    const res = await httpService.get<ProyectoDto>(`${BASE_ENDPOINT}/${id}`);
    return { ...res, data: mapProyectoData(res.data) };
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