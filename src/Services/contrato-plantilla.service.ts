import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto,
  ContratoActionResponse 
} from '../types/dto/contrato.dto';

const ContratoPlantillaService = {

  // =================================================
  // 📝 ADMIN (Creación y Edición)
  // =================================================

  create: async (data: CreatePlantillaDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    // ⚠️ IMPORTANTE: El backend middleware 'uploadPlantilla' busca exactamente 'plantillaFile'
    formData.append('plantillaFile', data.file); 
    
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('version', data.version.toString());
    
    if (data.id_proyecto) {
      formData.append('id_proyecto', data.id_proyecto.toString());
    }

    return await httpService.post('/contratos/plantillas/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updatePdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    // ⚠️ IMPORTANTE: 'plantillaFile' aquí también
    formData.append('plantillaFile', data.file); 

    return await httpService.post(`/contratos/plantillas/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  softDelete: async (id: number): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`/contratos/plantillas/soft-delete/${id}`);
  },

  // =================================================
  // 🔍 LECTURA
  // =================================================

  findAll: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get('/contratos/plantillas/all');
  },

  findUnassociated: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get('/contratos/plantillas/unassociated');
  },

  findByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`/contratos/plantillas/project/${idProyecto}`);
  },

  getByProjectAndVersion: async (idProyecto: number, version: number): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    return await httpService.get(`/contratos/plantilla/${idProyecto}/${version}`);
  }
};

export default ContratoPlantillaService;