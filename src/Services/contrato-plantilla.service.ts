import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto 
} from '../types/dto/contrato-plantilla.dto';
import type { ContratoActionResponse } from '../types/dto/contrato.dto';


const ContratoPlantillaService = {

  // =================================================
  // 📝 CREACIÓN Y EDICIÓN (ADMIN)
  // =================================================

  /**
   * Sube una nueva plantilla.
   * ⚠️ Clave del archivo: 'plantillaFile'
   */
  create: async (data: CreatePlantillaDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    formData.append('plantillaFile', data.file); // 👈 Clave específica requerida por tu middleware backend
    
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('version', data.version.toString());
    
    if (data.id_proyecto) {
      formData.append('id_proyecto', data.id_proyecto.toString());
    }

    return await httpService.post('/contratos/plantillas/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Actualiza el PDF de una plantilla existente (re-calcula hash).
   */
  updatePdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<{ message: string, plantilla: ContratoPlantillaDto }>> => {
    const formData = new FormData();
    formData.append('plantillaFile', data.file); // 👈 Clave específica

    return await httpService.post(`/contratos/plantillas/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Borrado lógico de una plantilla (Soft Delete).
   */
  softDelete: async (id: number): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`/contratos/plantillas/soft-delete/${id}`);
  },

  // =================================================
  // 🔍 CONSULTAS (ADMIN / SISTEMA)
  // =================================================

  /**
   * Obtiene TODAS las plantillas (incluidas inactivas).
   */
  findAll: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get('/contratos/plantillas/all');
  },

  /**
   * Obtiene plantillas activas que NO tienen proyecto asignado.
   * Útil para un selector "Asignar plantilla existente a nuevo proyecto".
   */
  findUnassociated: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get('/contratos/plantillas/unassociated');
  },

  /**
   * Obtiene todas las versiones activas para un proyecto.
   */
  findByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`/contratos/plantillas/project/${idProyecto}`);
  },

  /**
   * Obtiene una versión específica y verifica su integridad.
   * ⚠️ Revisar response.data.integrity_compromised antes de permitir usarla.
   */
  getByProjectAndVersion: async (idProyecto: number, version: number): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    return await httpService.get(`/contratos/plantilla/${idProyecto}/${version}`);
  }
};

export default ContratoPlantillaService;