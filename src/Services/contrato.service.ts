import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoDto, 
  UploadPlantillaDto, 
  SignContractDto, 
  UpdatePlantillaPdfDto,
  ContratoActionResponse
} from '../types/dto/contrato.dto';

const ContratoService = {

  // =================================================
  // 🔍 CONSULTAS GENERALES
  // =================================================

  /**
   * Obtiene un contrato por ID verificando su integridad.
   * Revisa `response.data.integrity_compromised` en el componente.
   */
  getById: async (id: number): Promise<AxiosResponse<ContratoDto>> => {
    return await httpService.get(`/contratos/${id}`);
  },

  /**
   * Obtiene los contratos firmados por el usuario actual.
   */
  getMyContracts: async (): Promise<AxiosResponse<ContratoDto[]>> => {
    return await httpService.get('/contratos/mis_contratos');
  },

  // =================================================
  // ✍️ FIRMA DIGITAL (Usuario)
  // =================================================

  /**
   * Sube el contrato firmado.
   * 🔒 Requiere 2FA activo y KYC aprobado (Manejado por middleware en backend).
   * Transforma el objeto DTO a FormData automáticamente.
   */
  signContract: async (data: SignContractDto): Promise<AxiosResponse<ContratoDto>> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('id_contrato_base', data.id_contrato_base.toString());
    formData.append('firma_digital', data.firma_digital);
    
    if (data.id_inversion) formData.append('id_inversion', data.id_inversion.toString());
    if (data.id_suscripcion) formData.append('id_suscripcion', data.id_suscripcion.toString());

    return await httpService.post('/contratos/firmar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // =================================================
  // ⬇️ DESCARGA DE ARCHIVOS
  // =================================================

  /**
   * Descarga el PDF del contrato.
   * ⚠️ Retorna un BLOB, no un JSON.
   * Se debe manejar la creación de la URL temporal en el componente o usar un helper.
   */
  download: async (id: number): Promise<Blob> => {
    const response = await httpService.get(`/contratos/descargar/${id}`, {
      responseType: 'blob' // Crucial para que Axios entienda que es un archivo
    });
    return response.data;
  },

  /**
   * Helper utilitario para disparar la descarga en el navegador
   * Uso: await ContratoService.triggerBrowserDownload(id, 'contrato.pdf');
   */
  triggerBrowserDownload: async (id: number, filename: string = 'documento.pdf') => {
    try {
      const blob = await ContratoService.download(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Limpiar memoria
    } catch (error) {
      console.error("Error descargando archivo", error);
      throw error;
    }
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (Plantillas)
  // =================================================

  uploadPlantilla: async (data: UploadPlantillaDto): Promise<AxiosResponse<ContratoDto>> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('id_proyecto', data.id_proyecto.toString());

    return await httpService.post('/contratos/plantillas/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updatePlantillaPdf: async (data: UpdatePlantillaPdfDto): Promise<AxiosResponse<ContratoDto>> => {
    const formData = new FormData();
    formData.append('file', data.file);

    return await httpService.post(`/contratos/plantillas/update-pdf/${data.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  softDelete: async (id: number): Promise<AxiosResponse<ContratoActionResponse>> => {
    return await httpService.put(`/contratos/plantillas/soft-delete/${id}`);
  },

  getAllPlantillas: async (): Promise<AxiosResponse<ContratoDto[]>> => {
    return await httpService.get('/contratos/plantillas/all');
  },
  
  getPlantillasByProject: async (idProyecto: number): Promise<AxiosResponse<ContratoDto[]>> => {
    return await httpService.get(`/contratos/plantillas/project/${idProyecto}`);
  }
};

export default ContratoService;