import type { ContratoFirmadoDto, ContratoFirmadoResponseDto, RegistrarFirmaRequestDto } from "@/core/types/contrato-firmado.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";


const BASE_ENDPOINT = '/contratos'; 

/**
 * Servicio para la gestión de contratos firmados.
 * Conecta con el controlador `contratoFirmadoController` del backend.
 */
const ContratoService = {

  // =================================================
  // ✍️ PROCESO DE FIRMA (Usuario)
  // =================================================

  /**
   * Registra un contrato firmado subiendo el PDF.
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
   * Obtiene un contrato por ID.
   */
  getById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene todos los contratos firmados del sistema (solo administradores).
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
   * ❌ ELIMINADO: try/catch y console.error.
   * El interceptor maneja los errores HTTP.
   */
  downloadAndSave: async (id: number, filename: string = 'contrato-firmado.pdf') => {
      // 1. Llamada a la API (Si falla, el interceptor avisa y detiene la ejecución)
      const blob = await ContratoService.download(id);
      
      // 2. Manipulación del DOM (Solo se ejecuta si la descarga fue exitosa)
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
  }
};

export default ContratoService;