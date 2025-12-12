import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoFirmadoDto, 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto,
  RegistrarFirmaRequestDto,
  ContratoFirmadoResponseDto,
  ContratoActionResponse
} from '../types/dto/contrato.dto';

// Ajusta esto si tu backend usa prefijos distintos para plantillas y firmados
// Según tus rutas: 
// - Firmados y General: '/contratos'
// - Plantillas: '/contratos/plantillas'
const BASE_ENDPOINT = '/contratos'; 

const ContratoService = {

  // =================================================
  // 🔍 CONSULTAS GENERALES (Contratos Firmados)
  // =================================================

  /**
   * Obtiene un contrato firmado por ID verificando su integridad.
   * GET /api/contratos/:id
   */
  getById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene los contratos firmados por el usuario actual.
   * GET /api/contratos/mis_contratos
   */
  getMyContracts: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_contratos`);
  },

  /**
   * Admin: Obtiene todos los contratos firmados.
   * GET /api/contratos/
   */
  findAllSigned: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/`);
  },

  // =================================================
  // ✍️ FIRMA DIGITAL (Usuario)
  // =================================================

  /**
   * Sube el contrato firmado con todas las validaciones de seguridad.
   * POST /api/contratos/firmar
   */
  registrarFirma: async (data: RegistrarFirmaRequestDto): Promise<AxiosResponse<ContratoFirmadoResponseDto>> => {
    const formData = new FormData();
    
    // Archivo (El middleware 'uploadSignedContract' espera 'file' o el nombre configurado en backend)
    formData.append('file', data.file); 
    
    // IDs Contextuales (Nombres exactos del controller)
    formData.append('id_contrato_plantilla', data.id_contrato_plantilla.toString());
    formData.append('id_proyecto', data.id_proyecto.toString());
    formData.append('id_usuario_firmante', data.id_usuario_firmante.toString());
    
    // Seguridad y Auditoría
    formData.append('hash_archivo_firmado', data.hash_archivo_firmado);
    formData.append('codigo_2fa', data.codigo_2fa);
    
    if (data.latitud_verificacion) formData.append('latitud_verificacion', data.latitud_verificacion);
    if (data.longitud_verificacion) formData.append('longitud_verificacion', data.longitud_verificacion);

    return await httpService.post(`${BASE_ENDPOINT}/firmar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // =================================================
  // ⬇️ DESCARGA DE ARCHIVOS
  // =================================================

  /**
   * Descarga el PDF del contrato.
   * GET /api/contratos/descargar/:id
   */
  download: async (id: number): Promise<Blob> => {
    const response = await httpService.get(`${BASE_ENDPOINT}/descargar/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Helper para descargar y guardar en el navegador
   */
  downloadAndSave: async (id: number, filename: string = 'documento.pdf') => {
    try {
      const blob = await ContratoService.download(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando archivo", error);
      throw error;
    }
  },

  // =================================================
  // ⚙️ GESTIÓN DE PLANTILLAS (Admin)
  // =================================================

  /**
   * Obtiene la plantilla activa para un proyecto.
   * GET /api/contratos/plantillas/project/:idProyecto
   */
  getPlantillasByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/plantillas/project/${idProyecto}`);
  },

  getAllPlantillas: async (): Promise<AxiosResponse<ContratoPlantillaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/plantillas/all`);
  },

  uploadPlantilla: async (data: CreatePlantillaDto): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    const formData = new FormData();
    // Middleware 'uploadPlantilla' suele esperar 'plantillaFile' o 'file'
    formData.append('plantillaFile', data.file); 
    formData.append('nombre_archivo', data.nombre_archivo);
    formData.append('version', data.version.toString());
    if (data.id_proyecto) formData.append('id_proyecto', data.id_proyecto.toString());

    return await httpService.post(`${BASE_ENDPOINT}/plantillas/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updatePlantillaPdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<ContratoPlantillaDto>> => {
    const formData = new FormData();
    formData.append('plantillaFile', data.file);

    return await httpService.post(`${BASE_ENDPOINT}/plantillas/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  softDeletePlantilla: async (id: number): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/plantillas/soft-delete/${id}`);
  },
};

export default ContratoService;