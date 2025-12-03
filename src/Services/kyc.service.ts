import type { KycDTO, KycStatusDTO, RejectKycDTO, SubmitKycDto } from '../types/dto/kyc.dto';
import httpService from './httpService';
import { AxiosError } from 'axios';

const ENDPOINT = '/kyc';

const kycService = {
  /**
   * (Usuario) Envía los datos y archivos para verificación.
   */
  async submit(submitData: Partial<SubmitKycDto>): Promise<any> {
    const formData = new FormData();
    
    // Agregar campos de texto
    if (submitData.tipo_documento) formData.append('tipo_documento', submitData.tipo_documento);
    if (submitData.numero_documento) formData.append('numero_documento', submitData.numero_documento);
    if (submitData.nombre_completo) formData.append('nombre_completo', submitData.nombre_completo);
    if (submitData.fecha_nacimiento) formData.append('fecha_nacimiento', submitData.fecha_nacimiento);
    
    // Agregar archivos
    if (submitData.documento_frente) formData.append('documento_frente', submitData.documento_frente);
    if (submitData.documento_dorso) formData.append('documento_dorso', submitData.documento_dorso);
    if (submitData.selfie_con_documento) formData.append('selfie_con_documento', submitData.selfie_con_documento);
    if (submitData.video_verificacion) formData.append('video_verificacion', submitData.video_verificacion);
    
    // Geolocalización opcional
    if (submitData.latitud_verificacion) formData.append('latitud_verificacion', submitData.latitud_verificacion.toString());
    if (submitData.longitud_verificacion) formData.append('longitud_verificacion', submitData.longitud_verificacion.toString());

    // ✅ FIX: Sintaxis correcta de template string
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData);
    return data;
  },

  /**
   * (Usuario) Obtiene el estado de verificación del usuario actual.
   * 🛡️ FIX APLICADO: Manejo de 404 cuando no existe registro.
   */
  async getStatus(): Promise<any> {
    try {
      // ✅ FIX: Sintaxis correcta
      const { data } = await httpService.get(`${ENDPOINT}/status`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 404) {
        return { estado_verificacion: 'NO_INICIADO' };
      }
      
      throw error;
    }
  },

  /**
   * (Admin) Lista todas las solicitudes pendientes.
   */
async getPendingVerifications(): Promise<KycDTO[]> {
    // ✅ CORRECCIÓN: El backend devuelve un array directo (KycDTO[]), no un objeto con propiedad 'solicitudes'
    const { data } = await httpService.get<KycDTO[]>(`${ENDPOINT}/pending`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * (Admin) Aprueba la verificación de un usuario.
   */
  async approveVerification(idUsuario: string | number): Promise<any> {
    // ✅ FIX: Sintaxis correcta
    const { data } = await httpService.post(`${ENDPOINT}/approve/${idUsuario}`);
    return data;
  },

  /**
   * (Admin) Rechaza la verificación de un usuario.
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
  },
};

export default kycService;