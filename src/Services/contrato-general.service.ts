import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { ContratoFirmadoDto } from '../types/dto/contrato.dto';

const ContratoGeneralService = {

  // =================================================
  // 📋 CONSULTAS
  // =================================================

  // Admin
  findAllSigned: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get('/contratos/');
  },

  // Usuario (Mis Contratos)
  findMyContracts: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get('/contratos/mis_contratos');
  },

  // Detalle por ID
  findById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`/contratos/${id}`);
  },

  // =================================================
  // ⬇️ DESCARGA SEGURA
  // =================================================

  downloadRequest: async (idContratoFirmado: number): Promise<Blob> => {
    const response = await httpService.get(`/contratos/descargar/${idContratoFirmado}`, {
      responseType: 'blob' 
    });
    return response.data;
  },

  /**
   * Helper para descargar y guardar automáticamente en el navegador
   */
  downloadAndSave: async (idContratoFirmado: number, fileNameSugestion: string = 'documento-legal.pdf') => {
    try {
      const blob = await ContratoGeneralService.downloadRequest(idContratoFirmado);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileNameSugestion);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error gestionando la descarga:", error);
      throw error;
    }
  }
};

export default ContratoGeneralService;