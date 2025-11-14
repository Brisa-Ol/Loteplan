import httpService from './httpService';
import type { KycDTO, KYCStatus, RejectKycDTO, KYCSubmissionResponse, KYCStatusResponse } from '../types/dto/kyc.dto';

const ENDPOINT = '/kyc';

// ❗ Definimos el tipo de respuesta genérico que usa tu backend
type MessageResponse = {
  message: string;
};

/**
 * Servicio para la gestión de Verificaciones KYC (Usuario y Admin)
 */
const kycService = {

  // =================================================================
  // 🧍 RUTAS DE USUARIO (Basadas en kyc.routes.js)
  // =================================================================

  /**
   * (Usuario) Envía los datos y archivos para verificación.
   * Llama a: POST /api/kyc/submit
   * ❗ 'data' DEBE ser un objeto FormData construido en tu componente React.
   * ❗ CORRECCIÓN: El DTO define KYCSubmissionResponse como la respuesta
   */
  async submitVerificationData(data: FormData): Promise<KYCSubmissionResponse> {
    const { data: responseData } = await httpService.post<KYCSubmissionResponse>(`${ENDPOINT}/submit`, data, {
      // Es crucial enviar el header correcto para archivos
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return responseData;
  },

  /**
   * (Usuario) Obtiene el estado de verificación del usuario actual.
   * Llama a: GET /api/kyc/status
   * ❗ CORRECCIÓN: El DTO define KYCStatusResponse como la respuesta
   */
  async getVerificationStatus(): Promise<KYCStatusResponse> {
    const { data } = await httpService.get<KYCStatusResponse>(`${ENDPOINT}/status`);
    return data;
  },

  // =================================================================
  // 🛡️ RUTAS DE ADMINISTRADOR (Basadas en kyc.routes.js)
  // =================================================================

  /**
   * (Admin) Lista todas las solicitudes pendientes de revisión.
   * Llama a: GET /api/kyc/pending
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycDTO[]>(`${ENDPOINT}/pending`);
    return data;
  },

  /**
   * (Admin) Aprueba la verificación de un usuario.
   * Llama a: POST /api/kyc/approve/:idUsuario
   * ❗ CORRECCIÓN: Cambiamos el tipo de retorno a MessageResponse para alinear con el componente
   */
  async approveVerification(idUsuario: string | number): Promise<MessageResponse> { 
    const { data } = await httpService.post<MessageResponse>(
      `${ENDPOINT}/approve/${idUsuario}`
    );
    return data;
  },

  /**
   * (Admin) Rechaza la verificación de un usuario.
   * Llama a: POST /api/kyc/reject/:idUsuario
   * ❗ CORRECCIÓN: Cambiamos el tipo de retorno a MessageResponse para alinear con el componente
   */
  async rejectVerification(
    idUsuario: string | number, 
    data: RejectKycDTO
  ): Promise<MessageResponse> { 
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${ENDPOINT}/reject/${idUsuario}`,
      data
    );
    return responseData;
  },

  /**
   * (Admin) Obtiene el estado de KYC de un usuario específico
   * ❗ NOTA: Esta ruta no está en tu kyc.routes.js, pero la dejamos
   * por si la necesitas para el panel de admin.
   */
  async getKYCStatus(userId: number | string): Promise<KycDTO> {
    const { data } = await httpService.get<KycDTO>(`${ENDPOINT}/status/${userId}`);
    return data;
  },
};

export default kycService;