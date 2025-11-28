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

    // NOTA: No es necesario poner el header Content-Type manualmente con axios/httpService, 
    // el navegador lo pone automático con el boundary correcto al ver FormData.
    const { data } = await httpService.post(`${ENDPOINT}/submit`, formData);
    return data;
  },

  /**
   * (Usuario) Obtiene el estado de verificación del usuario actual.
   * 🛡️ FIX APLICADO: Manejo de 404 cuando no existe registro.
   */
  async getStatus(): Promise<any> {
    try {
      const { data } = await httpService.get(`${ENDPOINT}/status`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      // Si el backend responde 404, significa que no hay registro de KYC aún.
      // Devolvemos un objeto "mock" para que el frontend muestre el formulario inicial.
      if (axiosError.response?.status === 404) {
        return { estado_verificacion: 'NO_INICIADO' };
      }
      // Si es otro error (500, 401, red), lo lanzamos para que React Query lo maneje.
      throw error;
    }
  },

  /**
   * (Admin) Lista todas las solicitudes pendientes.
   */
  async getPendingVerifications(): Promise<KycDTO[]> {
    const { data } = await httpService.get<{ total: number; solicitudes: KycDTO[] }>(
      `${ENDPOINT}/pending`
    );
    return data.solicitudes;
  },

  /**
   * (Admin) Aprueba la verificación de un usuario.
   */
  async approveVerification(idUsuario: string | number): Promise<any> {
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