import type { KycDTO, KycStatusDTO, RejectKycDTO, SubmitKycDto } from '../types/dto/kyc.dto';
import httpService from './httpService';

const ENDPOINT = '/kyc';

// Interfaz auxiliar para tipar las respuestas del backend (wrappers)
interface KycListResponse {
    success: boolean;
    total: number;
    solicitudes: KycDTO[];
}

const kycService = {
  /**
   * (Usuario) Envía los datos y archivos.
   * Backend Route: POST /api/kyc/submit
   */
  async submit(submitData: Partial<SubmitKycDto>): Promise<any> {
    const formData = new FormData();
    
    // Textos
    if (submitData.tipo_documento) formData.append('tipo_documento', submitData.tipo_documento);
    if (submitData.numero_documento) formData.append('numero_documento', submitData.numero_documento);
    if (submitData.nombre_completo) formData.append('nombre_completo', submitData.nombre_completo);
    if (submitData.fecha_nacimiento) formData.append('fecha_nacimiento', submitData.fecha_nacimiento);
    
    // Archivos (Nombres deben coincidir EXACTAMENTE con el middleware uploadKYCData del backend)
    if (submitData.documento_frente) formData.append('documento_frente', submitData.documento_frente);
    if (submitData.documento_dorso) formData.append('documento_dorso', submitData.documento_dorso);
    if (submitData.selfie_con_documento) formData.append('selfie_con_documento', submitData.selfie_con_documento);
    if (submitData.video_verificacion) formData.append('video_verificacion', submitData.video_verificacion);
    
    // Geo
    if (submitData.latitud_verificacion) formData.append('latitud_verificacion', submitData.latitud_verificacion.toString());
    if (submitData.longitud_verificacion) formData.append('longitud_verificacion', submitData.longitud_verificacion.toString());

    // Nota: Axios/httpService maneja el Content-Type multipart/form-data automáticamente al ver FormData
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData);
    return data;
  },

  /**
   * (Usuario) Obtiene estado.
   * Backend Route: GET /api/kyc/status
   */
  async getStatus(): Promise<KycStatusDTO> {
    const { data } = await httpService.get<any>(`${ENDPOINT}/status`);
    
    // Tu controlador devuelve: { success: true, estado_verificacion: "NO_INICIADO", ... }
    if (data.estado_verificacion === 'NO_INICIADO') {
        // Retornamos un objeto "dummy" seguro para evitar errores en la UI al leer propiedades
        return { 
            id: 0, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estado_verificacion: 'NO_INICIADO',
            id_usuario: 0,
            tipo_documento: 'DNI',
            numero_documento: '',
            nombre_completo: ''
        } as KycStatusDTO;
    }

    // Si ya existe, el backend devuelve los datos del modelo
    return data; 
  },

  /**
   * (Admin) Lista pendientes.
   * Backend Route: GET /api/kyc/pending
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/pending`);
    return data.solicitudes || [];
  },

  /**
   * (Admin) Lista aprobadas.
   * Backend Route: GET /api/kyc/approved
   */
  async getApprovedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/approved`);
    return data.solicitudes || [];
  },

  /**
   * (Admin) Lista rechazadas.
   * Backend Route: GET /api/kyc/rejected
   */
  async getRejectedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/rejected`);
    return data.solicitudes || [];
  },

  /**
   * (Admin) Lista todas.
   * Backend Route: GET /api/kyc/all
   */
  async getAllProcessedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/all`);
    return data.solicitudes || [];
  },

  /**
   * (Admin) Aprobar.
   * Backend Route: POST /api/kyc/approve/:idUsuario
   */
  async approveVerification(idUsuario: string | number): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
   * (Admin) Rechazar.
   * Backend Route: POST /api/kyc/reject/:idUsuario
   */
  async rejectVerification(
    idUsuario: string | number, 
    rejectData: RejectKycDTO
  ): Promise<any> {
    const { data } = await httpService.post(
      `${ENDPOINT}/reject/${idUsuario}`, 
      rejectData
    );
    return data;
  }
};

export default kycService;