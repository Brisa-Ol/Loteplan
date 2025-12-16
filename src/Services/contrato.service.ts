import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  ContratoFirmadoDto, 
  RegistrarFirmaRequestDto,
  ContratoFirmadoResponseDto
} from '../types/dto/contrato.dto';

const BASE_ENDPOINT = '/contratos'; 

const ContratoService = {

  // =================================================
  // ✍️ PROCESO DE FIRMA (Usuario)
  // =================================================

  /**
   * Sube el contrato firmado.
   * 🛑 CORRECCIÓN: El archivo se envía como 'pdfFile' para coincidir con Multer.
   */
  registrarFirma: async (data: RegistrarFirmaRequestDto): Promise<AxiosResponse<ContratoFirmadoResponseDto>> => {
    const formData = new FormData();
    
    // ✅ CRÍTICO: Backend espera uploadSignedContract = pdfUploadBase.single("pdfFile")
    formData.append('pdfFile', data.file); 
    
    // IDs y Datos de Negocio
    formData.append('id_contrato_plantilla', data.id_contrato_plantilla.toString());
    formData.append('id_proyecto', data.id_proyecto.toString());
    formData.append('id_usuario_firmante', data.id_usuario_firmante.toString());
    
    // Seguridad (Hash y 2FA)
    formData.append('hash_archivo_firmado', data.hash_archivo_firmado);
    formData.append('codigo_2fa', data.codigo_2fa);
    
    // Auditoría Geo (si existe)
    if (data.latitud_verificacion) formData.append('latitud_verificacion', data.latitud_verificacion);
    if (data.longitud_verificacion) formData.append('longitud_verificacion', data.longitud_verificacion);

    return await httpService.post(`${BASE_ENDPOINT}/firmar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // =================================================
  // 🔍 CONSULTAS (Usuario y Admin)
  // =================================================

  /**
   * Obtiene mis contratos firmados.
   */
  getMyContracts: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_contratos`);
  },

  /**
   * Obtiene un contrato por ID (verificando integridad en el backend).
   */
  getById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * ADMIN: Obtiene todos los contratos del sistema.
   */
  findAllSigned: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/`);
  },

  // =================================================
  // ⬇️ DESCARGA DE ARCHIVOS
  // =================================================

  /**
   * Pide el BLOB del PDF al backend.
   */
  download: async (id: number): Promise<Blob> => {
    const response = await httpService.get(`${BASE_ENDPOINT}/descargar/${id}`, {
      responseType: 'blob' // Importante para archivos binarios
    });
    return response.data;
  },

  /**
   * Helper para descargar y forzar el guardado en el navegador.
   */
  downloadAndSave: async (id: number, filename: string = 'contrato-firmado.pdf') => {
    try {
      const blob = await ContratoService.download(id);
      
      // Crear URL temporal
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Simular click
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      throw error;
    }
  }
};

export default ContratoService;