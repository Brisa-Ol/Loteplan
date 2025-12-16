import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto,
  ContratoActionResponse 
} from '../types/dto/contrato.dto';

// Ajusta la ruta base según tu backend (en tu router es /contratos/plantillas)
const ENDPOINT = '/contratos/plantillas';

const ContratoPlantillaService = {

  // =================================================
  // 📝 ADMIN (Creación y Edición)
  // =================================================

  create: async (data: CreatePlantillaDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    
    // ✅ CRÍTICO: Backend espera uploadPlantilla = pdfUploadBase.single("plantillaFile")
    formData.append('plantillaFile', data.file); 
    
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('version', data.version.toString());
    
    if (data.id_proyecto) {
      formData.append('id_proyecto', data.id_proyecto.toString());
    }

    return await httpService.post(`${ENDPOINT}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updatePdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    // ✅ CRÍTICO: Aquí también es 'plantillaFile'
    formData.append('plantillaFile', data.file); 

    return await httpService.post(`${ENDPOINT}/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  softDelete: async (id: number): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`${ENDPOINT}/soft-delete/${id}`);
  },

  // =================================================
  // 🔍 LECTURA
  // =================================================

  findAll: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/all`);
  },

  findUnassociated: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/unassociated`);
  },

  findByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/project/${idProyecto}`);
  },

  getByProjectAndVersion: async (idProyecto: number, version: number): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    return await httpService.get(`${ENDPOINT}/plantilla/${idProyecto}/${version}`);
  }
};

export default ContratoPlantillaService;