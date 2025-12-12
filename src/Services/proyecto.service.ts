import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { 
  AsignarLotesDto, 
  CompletionRateDTO, 
  CreateProyectoDto, 
  MonthlyProgressItem, 
  ProyectoDto, 
  UpdateProyectoDto 
} from '../types/dto/proyecto.dto';

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

  // ✅ CORRECCIÓN PRINCIPAL AQUÍ:
  // 1. Aceptamos 'image' como segundo argumento opcional.
  // 2. Convertimos todo a FormData para poder enviar el archivo.
  create: async (data: CreateProyectoDto, image: File | null): Promise<AxiosResponse<ProyectoDto>> => {
    const formData = new FormData();

    // 1. Agregar los campos del DTO al FormData
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof CreateProyectoDto];
      
      if (value !== undefined && value !== null) {
        // Manejo especial para Arrays (ej: lotesIds)
        if (Array.isArray(value)) {
          value.forEach((val) => formData.append(`${key}[]`, String(val)));
        } else {
          // Convertimos todo a string para el FormData
          formData.append(key, String(value));
        }
      }
    });

    // 2. Agregar la imagen si existe
    if (image) {
      // 'imagen' debe coincidir con el campo que espera tu middleware (Multer) en el backend
      formData.append('imagen', image); 
    }

    // 3. Enviar como multipart/form-data
    return await httpService.post(BASE_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
  // 📊 MÉTRICAS (KPIs)
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