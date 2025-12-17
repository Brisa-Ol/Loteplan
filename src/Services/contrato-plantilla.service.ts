import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto,
  ContratoActionResponse 
} from '../types/dto/contrato.dto';

const ENDPOINT = '/contratos/plantillas';

const ContratoPlantillaService = {

  // =================================================
  // 📝 ADMIN (Creación y Edición)
  // =================================================

  // 1. Crear nueva plantilla (POST /upload)
  create: async (data: CreatePlantillaDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
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

  // 2. Actualizar datos (Nombre, Proyecto, Versión) SIN tocar PDF (PUT /:id)
  update: async (id: number, data: Partial<ContratoPlantillaDto>): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    return await httpService.put(`${ENDPOINT}/${id}`, data);
  },

  // 3. Actualizar archivo PDF (POST /update-pdf/:id)
  updatePdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    formData.append('plantillaFile', data.file); 

    return await httpService.post(`${ENDPOINT}/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 4. ✅ CORREGIDO: Activar/Desactivar (Toggle) (PUT /toggle-active/:id)
  toggleActive: async (id: number, activo: boolean): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    return await httpService.put(`${ENDPOINT}/toggle-active/${id}`, { activo });
  },

  // 5. Borrado Lógico (PUT /soft-delete/:id)
  softDelete: async (id: number): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`${ENDPOINT}/soft-delete/${id}`);
  },

  // =================================================
  // 🔍 LECTURA
  // =================================================

  findAll: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/all`);
  },

  findAllActive: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/active`);
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