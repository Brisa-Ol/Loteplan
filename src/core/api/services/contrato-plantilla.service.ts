import type { ContratoPlantillaDto, CreatePlantillaDto, UpdatePlantillaPdfDto } from "@/core/types/contrato-plantilla.dto";
import type { ContratoActionResponse } from "@/core/types/contrato.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";


const ENDPOINT = '/contratos';

const ContratoPlantillaService = {

  // =================================================
  // 📝 ADMIN (Creación y Edición)
  // =================================================

 /**
   * Crea una nueva plantilla de contrato.
   * @returns Respuesta con { message, plantilla }
   */
  create: async (data: CreatePlantillaDto): Promise<AxiosResponse<ContratoActionResponse>> => {
    const formData = new FormData();
    
     // ✅ Campo coincide con middleware: uploadPlantilla
    formData.append('plantillaFile', data.file); 
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('version', data.version.toString());
    
    // ✅ Solo enviar si tiene valor (undefined = no se envía)
    if (data.id_proyecto !== undefined && data.id_proyecto !== null) {
      formData.append('id_proyecto', data.id_proyecto.toString());
    }

    return await httpService.post(`${ENDPOINT}/plantillas/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

 /**
   * Actualiza los datos de una plantilla (nombre, proyecto, versión).
   * NO modifica el archivo PDF.
   * @returns Respuesta con { message, plantilla }
   */
  update: async (
    id: number, 
    data: Partial<ContratoPlantillaDto>
  ): Promise<AxiosResponse<ContratoActionResponse>> => {
    const payload: Record<string, any> = {};
    
    if (data.nombre_archivo !== undefined) {
      payload.nombre_archivo = data.nombre_archivo;
    }
    
    if (data.version !== undefined) {
      payload.version = data.version;
    }
    
    if (data.id_proyecto !== undefined) {
      payload.id_proyecto = data.id_proyecto;
    }

    return await httpService.put(`${ENDPOINT}/plantillas/${id}`, payload);
  },

  /**
   * Actualiza solo el archivo PDF de una plantilla.
   * @returns Respuesta con { message, plantilla }
   */

  updatePdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<ContratoActionResponse>> => {
    const formData = new FormData();
    formData.append('plantillaFile', data.file); 

    return await httpService.post(`${ENDPOINT}/plantillas/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Activa o desactiva una plantilla.
   * @returns Respuesta con { message, plantilla }
   */

  toggleActive: async (id: number, activo: boolean): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`${ENDPOINT}/plantillas/toggle-active/${id}`, { activo });
  },

  /**
   * Realiza el borrado lógico de una plantilla.
   * @returns Respuesta con { message }
   */
  softDelete: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.put(`${ENDPOINT}/plantillas/soft-delete/${id}`);
  },

  // =================================================
  // 🔍 LECTURA
  // =================================================

  /**
   * Lista TODAS las plantillas (activas e inactivas).
   * ⚠️ Respuesta directa: array de plantillas (sin wrapper)
   */
  findAll: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/all`);
  },

  /**
   * Lista solo las plantillas activas.
   * ⚠️ Respuesta directa: array de plantillas (sin wrapper)
   */
  findAllActive: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/active`);
  },

  /**
   * Lista plantillas activas sin proyecto asignado.
   * ⚠️ Respuesta directa: array de plantillas (sin wrapper)
   */
  findUnassociated: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/unassociated`);
  },

  /**
   * Lista todas las versiones de plantillas activas para un proyecto.
   * ⚠️ Respuesta directa: array de plantillas (sin wrapper)
   */
  findByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${ENDPOINT}/plantillas/project/${idProyecto}`);
  },

  /**
   * Obtiene una plantilla específica por proyecto y versión.
   * Incluye verificación de integridad.
   * ⚠️ Respuesta directa: objeto plantilla (sin wrapper)
   */
  getByProjectAndVersion: async (
    idProyecto: number, 
    version: number
  ): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    return await httpService.get(`${ENDPOINT}/plantilla/${idProyecto}/${version}`);
  }
};

export default ContratoPlantillaService;