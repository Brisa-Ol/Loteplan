// src/services/proyecto.service.ts
import httpService from './httpService';
import type { 
  ProyectoDTO, 
  CreateProyectoDTO, 
  UpdateProyectoDTO,
  AssignLotesDTO
} from '../types/dto/proyecto.dto';
import type { 
  CompletionRateDTO, 
  MonthlyProgressItem 
} from '../types/dto/auth.types';

const ENDPOINT = '/proyectos';

const proyectoService = {
  // ══════════════════════════════════════════════════════════
  // 🛡️ FUNCIONES DE ADMINISTRADOR
  // ══════════════════════════════════════════════════════════

  /** Llama a: GET /api/proyectos */
  async getAllProyectos(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>(ENDPOINT);
    return data;
  },

  /** Llama a: GET /api/proyectos/:id */
  async getProyectoById(id: number | string): Promise<ProyectoDTO> {
    const { data } = await httpService.get<ProyectoDTO>(`${ENDPOINT}/${id}`);
    return data;
  },

  /** Llama a: POST /api/proyectos */
  async createProyecto(proyectoData: CreateProyectoDTO): Promise<ProyectoDTO> {
    const { data } = await httpService.post<ProyectoDTO>(ENDPOINT, proyectoData);
    return data;
  },

  /** Llama a: PUT /api/proyectos/:id */
  async updateProyecto(id: number | string, proyectoData: UpdateProyectoDTO): Promise<ProyectoDTO> {
    const { data } = await httpService.put<ProyectoDTO>(`${ENDPOINT}/${id}`, proyectoData);
    return data;
  },

  /** Llama a: DELETE /api/proyectos/:id */
  async deleteProyecto(id: number | string): Promise<{ mensaje: string }> {
    const { data } = await httpService.delete<{ mensaje: string }>(`${ENDPOINT}/${id}`);
    return data;
  },

  /** Llama a: PUT /api/proyectos/:id/lotes */
  async assignLotesToProyecto(id: number | string, lotesData: AssignLotesDTO): Promise<ProyectoDTO> {
    const { data } = await httpService.put<{ mensaje: string, proyecto: ProyectoDTO }>(
      `${ENDPOINT}/${id}/lotes`, 
      lotesData
    );
    return data.proyecto;
  },

  /** Llama a: PUT /api/proyectos/:id/iniciar-proceso */
  async iniciarProcesoProyecto(id: number | string): Promise<ProyectoDTO> {
    const { data } = await httpService.put<{ mensaje: string, proyecto: ProyectoDTO }>(
      `${ENDPOINT}/${id}/iniciar-proceso`
    );
    return data.proyecto;
  },

  // --- Métricas de Admin ---

  /** Llama a: GET /api/proyectos/metricas/culminacion */
  async getCompletionRate(): Promise<CompletionRateDTO> {
    const { data } = await httpService.get<{ data: CompletionRateDTO }>(`${ENDPOINT}/metricas/culminacion`);
    return data.data;
  },

  /** Llama a: GET /api/proyectos/metricas/avance-mensual */
  async getMonthlyProgress(): Promise<MonthlyProgressItem[]> {
    const { data } = await httpService.get<{ data: MonthlyProgressItem[] }>(`${ENDPOINT}/metricas/avance-mensual`);
    return data.data;
  },

  // ══════════════════════════════════════════════════════════
  // 🧍 FUNCIONES PÚBLICAS/USUARIO
  // ══════════════════════════════════════════════════════════

  /** Llama a: GET /api/proyectos/activos */
  async getActiveProyectos(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>(`${ENDPOINT}/activos`);
    return data;
  },
  
  /** Llama a: GET /api/proyectos/activos/ahorristas */
  async getActiveProyectosAhorrista(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>(`${ENDPOINT}/activos/ahorristas`);
    return data;
  },
  
  /** Llama a: GET /api/proyectos/activos/inversionistas */
  async getActiveProyectosInversionista(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>(`${ENDPOINT}/activos/inversionistas`);
    return data;
  },
  
  /** Llama a: GET /api/proyectos/:id/activo */
  async getActiveProyectoById(id: number | string): Promise<ProyectoDTO> {
    const { data } = await httpService.get<ProyectoDTO>(`${ENDPOINT}/${id}/activo`);
    return data;
  },

  /** Llama a: GET /api/proyectos/mis-proyectos */
  async getMyProjects(): Promise<ProyectoDTO[]> {
    const { data } = await httpService.get<ProyectoDTO[]>(`${ENDPOINT}/mis-proyectos`);
    return data;
  },
};

export default proyectoService;