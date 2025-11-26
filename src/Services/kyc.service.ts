// src/services/kyc.service.ts (CORREGIDO Y FUNCIONAL)
import type { KycDTO, KycStatusDTO, RejectKycDTO } from '../types/dto/kyc.dto';
import httpService from './httpService';


const ENDPOINT = '/kyc';

const kycService = {

  // =================================================================
  // 👤 MÉTODOS DE USUARIO (Cliente)
  // =================================================================

  /**
   * (Usuario) Envía los datos y archivos para verificación.
   * Llama a: POST /api/kyc/submit
   */
  async submitVerificationData(formData: FormData): Promise<KycDTO> {
    // ❗ CORRECCIÓN: Desestructuramos { data } para obtener el KycDTO
    const { data } = await httpService.post<KycDTO>(`${ENDPOINT}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * (Usuario) Obtiene el estado de verificación del usuario actual.
   * Llama a: GET /api/kyc/status
   */
  async getVerificationStatus(): Promise<KycStatusDTO> {
    // ❗ CORRECCIÓN: Desestructuramos { data }
    const { data } = await httpService.get<KycStatusDTO>(`${ENDPOINT}/status`);
    return data;
  },

  // =================================================================
  // 👮 MÉTODOS DE ADMINISTRADOR (Gestión)
  // =================================================================

  /**
   * (Admin) Lista todas las solicitudes pendientes de revisión.
   * Llama a: GET /api/kyc/pending
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    // ❗ CORRECCIÓN: Desestructuramos { data }
    const { data } = await httpService.get<KycDTO[]>(`${ENDPOINT}/pending`);
    return data;
  },

  /**
   * (Admin) Aprueba la verificación de un usuario.
   * Llama a: POST /api/kyc/approve/:idUsuario
   */
  async approveVerification(idUsuario: string | number): Promise<KycDTO> {
    // ❗ CORRECCIÓN: Desestructuramos { data }
    const { data } = await httpService.post<KycDTO>(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
   * (Admin) Rechaza la verificación de un usuario.
   * Llama a: POST /api/kyc/reject/:idUsuario
   */
  async rejectVerification(idUsuario: string | number, rejectData: RejectKycDTO): Promise<KycDTO> {
    // ❗ CORRECCIÓN: Desestructuramos { data }
    const { data } = await httpService.post<KycDTO>(
      `${ENDPOINT}/reject/${idUsuario}`, 
      rejectData
    );
    return data;
  },
};

export default kycService;