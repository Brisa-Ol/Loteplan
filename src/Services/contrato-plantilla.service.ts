// src/services/contrato-plantilla.service.ts

import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto,
  ContratoActionResponse 
} from '../types/dto/contrato.dto';

const ENDPOINT = '/contratos';

const ContratoPlantillaService = {

  // =================================================
  // 📝 ADMIN (Creación y Edición)
  // =================================================

  /**
   * Crea una nueva plantilla de contrato.
   * Llama a: contratoPlantillaService.create(data) en el Backend.
   * El backend espera 'plantillaFile' en req.files y los datos en req.body.
   */
  create: async (data: CreatePlantillaDto): Promise<AxiosResponse<ContratoActionResponse>> => {
    const formData = new FormData();
    
    // ✅ Clave 'plantillaFile' debe coincidir con tu middleware Multer en el router del backend
    formData.append('plantillaFile', data.file); 
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('version', data.version.toString());
    
    // ✅ Backend permite id_proyecto null (plantilla global)
    if (data.id_proyecto !== undefined && data.id_proyecto !== null) {
      formData.append('id_proyecto', data.id_proyecto.toString());
    }

    // Asegúrate de que tu ruta en el backend sea exactamente esta
    return await httpService.post(`${ENDPOINT}/plantillas/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Actualiza los metadatos de una plantilla.
   * Llama a: contratoPlantillaService.updatePlantillaData(id, updateData) en el Backend.
   */
  update: async (
    id: number, 
    data: Partial<ContratoPlantillaDto>
  ): Promise<AxiosResponse<ContratoActionResponse>> => {
    const payload: Record<string, any> = {};
    
    // Solo enviamos los campos que tu service de backend permite en 'allowedFields'
    if (data.nombre_archivo !== undefined) {
      payload.nombre_archivo = data.nombre_archivo;
    }
    
    if (data.version !== undefined) {
      payload.version = data.version;
    }
    
    if (data.id_proyecto !== undefined) {
      // Backend espera null para desasignar o un ID válido
      payload.id_proyecto = data.id_proyecto;
    }

    return await httpService.put(`${ENDPOINT}/plantillas/${id}`, payload);
  },

  /**
   * Actualiza SOLO el archivo PDF.
   * Llama a: contratoPlantillaService.updatePdf(id, buffer, path) en el Backend.
   */
  updatePdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<ContratoActionResponse>> => {
    const formData = new FormData();
    formData.append('plantillaFile', data.file); 

    return await httpService.post(`${ENDPOINT}/plantillas/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Activa/Desactiva una plantilla.
   * Llama a: contratoPlantillaService.toggleActive(id, activo) en el Backend.
   */
  toggleActive: async (id: number, activo: boolean): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`${ENDPOINT}/plantillas/toggle-active/${id}`, { activo });
  },

  /**
   * Borrado lógico.
   * Llama a: contratoPlantillaService.softDelete(id) en el Backend.
   */
  softDelete: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.put(`${ENDPOINT}/plantillas/soft-delete/${id}`);
  },

  // =================================================
  // 🔍 LECTURA (Coincidiendo con tus métodos del Backend)
  // =================================================

  /**
   * Llama a: contratoPlantillaService.findAll()
   */
  findAll: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/all`);
  },

  /**
   * Llama a: contratoPlantillaService.findAllActivo()
   */
  findAllActive: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/active`);
  },

  /**
   * Llama a: contratoPlantillaService.findUnassociated()
   */
  findUnassociated: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/unassociated`);
  },

  /**
   * Llama a: contratoPlantillaService.findByProjectId(id_proyecto)
   */
  findByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/project/${idProyecto}`);
  },

  /**
   * Llama a: contratoPlantillaService.findByProyectoAndVersion(id_proyecto, version)
   * ✅ ESTE ES CLAVE: Devuelve el campo integrity_compromised calculado en el Back.
   */
  getByProjectAndVersion: async (
    idProyecto: number, 
    version: number
  ): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    return await httpService.get(`${ENDPOINT}/plantilla/${idProyecto}/${version}`);
  }
};

export default ContratoPlantillaService;