// src/services/kycService.ts
import type { KycDTO, KycStatusDTO, RejectKycDTO, SubmitKycDto } from '../types/dto/kyc.dto';
import httpService from './httpService';

// 🚨 CORRECCIÓN CLAVE: Quitamos '/api' porque ya está en el .env
const ENDPOINT = '/kyc'; 

// Interfaces internas para respuestas de lista/estado
interface KycListResponse {
  success: boolean;
  total: number;
  solicitudes: KycDTO[];
}

interface KycStatusResponse {
  success: boolean;
  estado_verificacion: string;
  mensaje?: string;
  puede_enviar?: boolean;
  // Propiedades del modelo si existe
  id?: number;
  id_usuario?: number;
  tipo_documento?: string;
  numero_documento?: string;
  nombre_completo?: string;
  fecha_nacimiento?: string;
  motivo_rechazo?: string;
  createdAt?: string;
  updatedAt?: string;
}

const kycService = {
  /**
   * (Usuario) Envía los datos y archivos.
   */
  async submit(submitData: Partial<SubmitKycDto>): Promise<any> {
    const formData = new FormData();
    
    // Textos
    if (submitData.tipo_documento) formData.append('tipo_documento', submitData.tipo_documento);
    if (submitData.numero_documento) formData.append('numero_documento', submitData.numero_documento);
    if (submitData.nombre_completo) formData.append('nombre_completo', submitData.nombre_completo);
    if (submitData.fecha_nacimiento) formData.append('fecha_nacimiento', submitData.fecha_nacimiento);
    
    // Archivos
    if (submitData.documento_frente) formData.append('documento_frente', submitData.documento_frente);
    if (submitData.documento_dorso) formData.append('documento_dorso', submitData.documento_dorso);
    if (submitData.selfie_con_documento) formData.append('selfie_con_documento', submitData.selfie_con_documento);
    if (submitData.video_verificacion) formData.append('video_verificacion', submitData.video_verificacion);
    
    // Geo
    if (submitData.latitud_verificacion) formData.append('latitud_verificacion', submitData.latitud_verificacion.toString());
    if (submitData.longitud_verificacion) formData.append('longitud_verificacion', submitData.longitud_verificacion.toString());

    // Axios maneja el Content-Type multipart automáticamente al recibir FormData
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData);
    return data;
  },

  /**
   * (Usuario) Obtiene estado actual.
   */
  async getStatus(): Promise<KycStatusDTO> {
    const { data } = await httpService.get<KycStatusResponse>(`${ENDPOINT}/status`);
    
    // Caso: No ha iniciado el trámite
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
        puede_enviar: true // ✅ Importante para habilitar el form
      } as KycStatusDTO;
    }

    // Caso: Ya existe registro (Normalizamos la respuesta)
    return {
      id: data.id!,
      createdAt: data.createdAt!,
      updatedAt: data.updatedAt!,
      activo: true, // Asumimos true o lo traes del back si viene
      estado_verificacion: data.estado_verificacion as any,
      id_usuario: data.id_usuario!,
      tipo_documento: data.tipo_documento as any,
      numero_documento: data.numero_documento!,
      nombre_completo: data.nombre_completo!,
      fecha_nacimiento: data.fecha_nacimiento,
      motivo_rechazo: data.motivo_rechazo,
      puede_enviar: data.puede_enviar // ✅ Pasamos el flag del back
    };
  },

  // --- Métodos de Admin (Rutas limpias) ---

  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/pending`);
    return data.solicitudes || [];
  },

  async getApprovedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/approved`);
    return data.solicitudes || [];
  },

  async getRejectedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/rejected`);
    return data.solicitudes || [];
  },

  async getAllProcessedVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<KycListResponse>(`${ENDPOINT}/all`);
    return data.solicitudes || [];
  },

  async approveVerification(idUsuario: string | number): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  async rejectVerification(idUsuario: string | number, rejectData: RejectKycDTO): Promise<any> {
    const { data } = await httpService.post(`${ENDPOINT}/reject/${idUsuario}`, rejectData);
    return data;
  }
};

export default kycService;