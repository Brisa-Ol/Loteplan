import type { KycDTO, KycStatusDTO, RejectKycDTO, SubmitKycDto } from '../types/dto/kyc.dto';
import httpService from './httpService';

const ENDPOINT = '/kyc'; 

// Interfaces internas para tipar respuestas de axios
interface KycListResponse {
  success: boolean;
  total: number;
  solicitudes: KycDTO[];
}

// Respuesta cruda del endpoint /status (antes de normalizar)
interface KycStatusResponse {
  success: boolean;
  estado_verificacion: string;
  mensaje?: string;
  puede_enviar?: boolean;
  // ... resto de propiedades opcionales del modelo
  id?: number;
  // ...
  motivo_rechazo?: string;
}

/**
 * Servicio para la gestión de la Verificación de Identidad (KYC).
 * Conecta los flujos de usuario (carga de documentos) y administrador (aprobación/rechazo).
 */
const kycService = {
  
  // ==========================================
  // 👤 MÉTODOS DE USUARIO FINAL
  // ==========================================

  /**
   * Envía los datos y archivos para una nueva verificación.
   * Transforma el objeto DTO en `FormData` para soportar subida de archivos.
   * * @param submitData - Objeto con datos personales y archivos (File objects).
   * @returns Respuesta del servidor confirmando la recepción.
   */
  async submit(submitData: Partial<SubmitKycDto>): Promise<any> {
    const formData = new FormData();
    
    // --- Mapeo de Textos ---
    if (submitData.tipo_documento) formData.append('tipo_documento', submitData.tipo_documento);
    if (submitData.numero_documento) formData.append('numero_documento', submitData.numero_documento);
    if (submitData.nombre_completo) formData.append('nombre_completo', submitData.nombre_completo);
    if (submitData.fecha_nacimiento) formData.append('fecha_nacimiento', submitData.fecha_nacimiento);
    
    // --- Mapeo de Archivos ---
    if (submitData.documento_frente) formData.append('documento_frente', submitData.documento_frente);
    if (submitData.documento_dorso) formData.append('documento_dorso', submitData.documento_dorso);
    if (submitData.selfie_con_documento) formData.append('selfie_con_documento', submitData.selfie_con_documento);
    if (submitData.video_verificacion) formData.append('video_verificacion', submitData.video_verificacion);
    
    // --- Mapeo de Geo-referencia ---
    if (submitData.latitud_verificacion) formData.append('latitud_verificacion', submitData.latitud_verificacion.toString());
    if (submitData.longitud_verificacion) formData.append('longitud_verificacion', submitData.longitud_verificacion.toString());

    // El navegador y Axios configuran automáticamente el Content-Type multipart/form-data
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData);
    return data;
  },

  /**
   * Obtiene el estado actual de la verificación del usuario logueado.
   * Normaliza la respuesta para manejar consistentemente el caso "NO_INICIADO".
   * * @returns Objeto `KycStatusDTO` seguro para la UI.
   */
  async getStatus(): Promise<KycStatusDTO> {
    const { data } = await httpService.get<KycStatusResponse>(`${ENDPOINT}/status`);
    
    // Caso A: Usuario nuevo sin registros previos
    if (data.estado_verificacion === 'NO_INICIADO') {
      return {
        id: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activo: true,
        estado_verificacion: 'NO_INICIADO',
        id_usuario: 0,
        tipo_documento: 'DNI',
        numero_documento: '',
        nombre_completo: '',
        puede_enviar: true // Habilita el formulario
      } as KycStatusDTO;
    }

    // Caso B: Usuario con historial (PENDIENTE, APROBADA o RECHAZADA)
    return {
      id: data.id!,
      // ... mapeo de campos existentes ...
      estado_verificacion: data.estado_verificacion as any,
      puede_enviar: data.puede_enviar,
      motivo_rechazo: data.motivo_rechazo
      // ... resto de campos
    } as KycStatusDTO;
  },

  // ==========================================
  // 👮 MÉTODOS DE ADMINISTRADOR
  // ==========================================

  /**
   * Lista todas las solicitudes en estado PENDIENTE.
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/pending`);
    return data.solicitudes || [];
  },

  /**
   * Lista todas las solicitudes históricas APROBADAS.
   */
  async getApprovedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/approved`);
    return data.solicitudes || [];
  },

  /**
   * Lista todas las solicitudes históricas RECHAZADAS.
   */
  async getRejectedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/rejected`);
    return data.solicitudes || [];
  },

  /**
   * Obtiene el historial completo (Aprobadas + Rechazadas).
   */
  async getAllProcessedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/all`);
    return data.solicitudes || [];
  },

  /**
   * Aprueba una solicitud de verificación.
   * @param idUsuario - ID del usuario cuya solicitud se aprueba.
   */
  async approveVerification(idUsuario: string | number): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
   * Rechaza una solicitud de verificación.
   * @param idUsuario - ID del usuario.
   * @param rejectData - Objeto con el motivo del rechazo.
   */
  async rejectVerification(idUsuario: string | number, rejectData: RejectKycDTO): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/reject/${idUsuario}`, rejectData);
    return data;
  }
};

export default kycService;