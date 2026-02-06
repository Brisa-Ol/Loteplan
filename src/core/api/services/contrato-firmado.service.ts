import type { 
  ContratoFirmadoDto, 
  ContratoFirmadoResponseDto, 
  RegistrarFirmaRequestDto 
} from "@/core/types/dto/contrato-firmado.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";

const BASE_ENDPOINT = '/contratos'; 

const ContratoFirmadoService = {

  // =================================================
  // ✍️ PROCESO DE FIRMA (Usuario)
  // =================================================

  /**
   * Registra un contrato firmado.
   * Envía el PDF, los metadatos, el hash calculado y el código 2FA.
   */
  registrarFirma: async (data: RegistrarFirmaRequestDto): Promise<AxiosResponse<ContratoFirmadoResponseDto>> => {
    const formData = new FormData();
    
    // 🚨 IMPORTANTE: Tu backend (multer) espera el campo 'pdfFile'
    formData.append('pdfFile', data.file); 
    
    // IDs Contextuales
    formData.append('id_contrato_plantilla', data.id_contrato_plantilla.toString());
    formData.append('id_proyecto', data.id_proyecto.toString());
    formData.append('id_usuario_firmante', data.id_usuario_firmante.toString());
    
    // Seguridad (Hash calculado en el front y TOTP)
    formData.append('hash_archivo_firmado', data.hash_archivo_firmado);
    formData.append('codigo_2fa', data.codigo_2fa);
    
    // Auditoría Geo (Opcionales)
    if (data.latitud_verificacion) formData.append('latitud_verificacion', data.latitud_verificacion);
    if (data.longitud_verificacion) formData.append('longitud_verificacion', data.longitud_verificacion);

    // POST a /api/contratos/firmar
    return await httpService.post(`${BASE_ENDPOINT}/firmar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // =================================================
  // 🔍 CONSULTAS
  // =================================================

  /**
   * Obtiene mis contratos firmados (Usuario Logueado).
   * GET /api/contratos/mis_contratos
   */
  findMyContracts: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_contratos`);
  },

  /**
   * Obtiene todos los contratos firmados del sistema (Solo Admin).
   * GET /api/contratos/
   */
  findAllSigned: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/`);
  },

  /**
   * Obtiene un contrato específico por ID.
   * GET /api/contratos/:id
   */
  findById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // ⬇️ UTILIDADES DE RUTA
  // =================================================

  /**
   * Retorna la ruta relativa de la API para descargar un contrato de forma segura.
   * Esta ruta se pasará a 'downloadSecureFile' en el hook.
   * Ruta Backend: GET /api/contratos/descargar/:id (Protegida por KYC + 2FA)
   */
  getDownloadUrl: (id: number): string => {
    return `${BASE_ENDPOINT}/descargar/${id}`;
  },

  /**
   * Obtiene la posición actual del navegador (Helper para el modal de firma).
   */
  getCurrentPosition: (): Promise<{ lat: string, lng: string } | null> => {
    return new Promise((resolve) => {
       if (!navigator.geolocation) { resolve(null); return; }
       navigator.geolocation.getCurrentPosition(
         (pos) => resolve({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }),
         () => resolve(null)
       );
    });
  }
};

export default ContratoFirmadoService;