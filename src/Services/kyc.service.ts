// src/services/kyc.service.ts (COMPLETO Y ALINEADO)
import httpService from './httpService';
import type { KycDTO, KycStatusDTO, RejectKycDTO } from '../types/dto/kyc.dto';

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
   */
  async submitVerificationData(data: FormData): Promise<KycDTO> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: responseData } = await httpService.post<KycDTO>(`${ENDPOINT}/submit`, data, {
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
   */
  async getVerificationStatus(): Promise<KycStatusDTO> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data } = await httpService.get<KycStatusDTO>(`${ENDPOINT}/status`);
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
   */
  async approveVerification(idUsuario: string | number): Promise<KycDTO> { // ❗ CORRECCIÓN: Tu backend devuelve el KycDTO actualizado
    const { data } = await httpService.post<KycDTO>(
      `${ENDPOINT}/approve/${idUsuario}`
    );
    return data;
  },

  /**
   * (Admin) Rechaza la verificación de un usuario.
   * Llama a: POST /api/kyc/reject/:idUsuario
   */
  async rejectVerification(
    idUsuario: string | number, 
    data: RejectKycDTO
  ): Promise<KycDTO> { // ❗ CORRECCIÓN: Tu backend devuelve el KycDTO actualizado
    const { data: responseData } = await httpService.post<KycDTO>(
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