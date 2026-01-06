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
  id?: number;
  motivo_rechazo?: string;
}
/**
 * Servicio para la gestión de la Verificación de Identidad (KYC).
 * Conecta con el controlador `verificacionIdentidadController` del backend.
 * 
 * @remarks
 * - El KYC es obligatorio para realizar operaciones financieras (suscripciones, inversiones, pagos)
 * - Los usuarios suben documentos de identidad y selfie
 * - Los administradores revisan y aprueban/rechazan las solicitudes
 * - El estado puede ser: NO_INICIADO, PENDIENTE, APROBADA, RECHAZADA
 * - Los archivos se envían como FormData (multipart/form-data)
 */
const kycService = {
  
  // ==========================================
  // 👤 MÉTODOS DE USUARIO FINAL
  // ==========================================

  /**
   * Envía los datos y archivos para una nueva verificación.
   * 
   * @param submitData - Datos personales y archivos (documentos, selfie, video)
   * @returns Respuesta del servidor confirmando la recepción
   *@remarks
   * Backend: POST /api/kyc/submit
   * - Requiere autenticación
   * - Transforma el DTO en FormData para soportar archivos
   * - Archivos requeridos: documento_frente, documento_dorso, selfie_con_documento
   * - Archivo opcional: video_verificacion
   * - Incluye verificación geográfica opcional (latitud/longitud)
   * - Crea la solicitud en estado 'PENDIENTE'
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
   * Obtiene el estado actual de la verificación de identidad del usuario autenticado.
   * 
   * @returns Estado de verificación normalizado
   * 
   * @remarks
   * Backend: GET /api/kyc/status
   * - Requiere autenticación
   * - Normaliza la respuesta para manejar el caso "NO_INICIADO"
   * - Retorna: estado_verificacion, puede_enviar, motivo_rechazo (si aplica)
   * - Si no hay solicitud previa, retorna estado "NO_INICIADO" con puede_enviar: true
   * 
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

    } as KycStatusDTO;
  },

  // ==========================================
  // 👮 MÉTODOS DE ADMINISTRADOR
  // ==========================================

  /**
 * Lista todas las solicitudes de verificación en estado PENDIENTE (solo administradores).
   * 
   * @returns Lista de solicitudes pendientes de revisión
   * 
   * @remarks
   * Backend: GET /api/kyc/pending
   * - Requiere autenticación y rol admin
   * - Retorna solo solicitudes que esperan aprobación/rechazo
   * - Incluye todos los archivos y datos del usuario
   * 
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/pending`);
    return data.solicitudes || [];
  },

  /**
   * Lista todas las solicitudes históricas APROBADAS (solo administradores).
   *    * 
   * @returns Lista de solicitudes aprobadas
   * 
   * @remarks
   * Backend: GET /api/kyc/approved
   * - Requiere autenticación y rol admin
   * - Retorna historial de aprobaciones
   * 
   */
  async getApprovedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/approved`);
    return data.solicitudes || [];
  },

  /**
  * Lista todas las solicitudes históricas RECHAZADAS (solo administradores).
   * 
   * @returns Lista de solicitudes rechazadas
   * 
   * @remarks
   * Backend: GET /api/kyc/rejected
   * - Requiere autenticación y rol admin
   * - Retorna historial de rechazos con motivos
   * 
   */
  async getRejectedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/rejected`);
    return data.solicitudes || [];
  },

  /**
    * Obtiene el historial completo de solicitudes procesadas (solo administradores).
   * 
   * @returns Lista de solicitudes aprobadas y rechazadas
   * 
   * @remarks
   * Backend: GET /api/kyc/all
   * - Requiere autenticación y rol admin
   * - Retorna todas las solicitudes con estado final (APROBADA o RECHAZADA)
   * - Útil para reportes y análisis
   * 
   */
  async getAllProcessedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/all`);
    return data.solicitudes || [];
  },

  /**
  * Aprueba una solicitud de verificación de identidad (solo administradores).
   * 
   * @param idUsuario - ID del usuario cuya solicitud se aprueba
   * @returns Respuesta de confirmación
   * 
   * @remarks
   * Backend: POST /api/kyc/approve/:idUsuario
   * - Requiere autenticación y rol admin
   * - Cambia el estado a 'APROBADA'
   * - Habilita al usuario para realizar operaciones financieras
   * - Envía notificación al usuario
   * 
   */
  async approveVerification(idUsuario: string | number): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
* Rechaza una solicitud de verificación de identidad (solo administradores).
   * 
   * @param idUsuario - ID del usuario
   * @param rejectData - Motivo del rechazo
   * @returns Respuesta de confirmación
   * 
   * @remarks
   * Backend: POST /api/kyc/reject/:idUsuario
   * - Requiere autenticación y rol admin
   * - Cambia el estado a 'RECHAZADA'
   * - Guarda el motivo del rechazo
   * - El usuario puede enviar una nueva solicitud después
   * - Envía notificación al usuario con el motivo
   * 
   */
  async rejectVerification(idUsuario: string | number, rejectData: RejectKycDTO): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/reject/${idUsuario}`, rejectData);
    return data;
  }
};

export default kycService;