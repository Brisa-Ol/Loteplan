import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { KycStatusResponseDto, SubmitKycDto } from '../types/dto/kyc.dto';

const BASE_ENDPOINT = '/kyc'; // Ajusta si en app.js usaste otro prefijo

const KycService = {
  
  /**
   * GET /api/kyc/status
   * Verifica si el usuario ya subió documentos y en qué estado están.
   */
  getStatus: async (): Promise<AxiosResponse<KycStatusResponseDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/status`);
  },

  /**
   * POST /api/kyc/submit
   * Sube los 4 archivos requeridos.
   */
  submit: async (files: SubmitKycDto): Promise<AxiosResponse<KycStatusResponseDto>> => {
    const formData = new FormData();
    
    // ⚠️ LOS NOMBRES DEBEN COINCIDIR EXACTAMENTE CON TU MIDDLEWARE DE BACKEND
    formData.append('documento_frente', files.documento_frente);
    formData.append('documento_dorso', files.documento_dorso);
    formData.append('selfie_con_documento', files.selfie_con_documento);
    formData.append('video_verificacion', files.video_verificacion);

    return await httpService.post(`${BASE_ENDPOINT}/submit`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' // Crucial para subida de archivos
      }
    });
  }
};

export default KycService;