import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { ContratoFirmadoDto } from "@/core/types/contrato-firmado.dto";


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
   * Helper para descargar y guardar automáticamente en el navegador.
   * ❌ ELIMINADO: try/catch y console.error.
   * El interceptor maneja los errores HTTP.
   */
  downloadAndSave: async (idContratoFirmado: number, fileNameSugestion: string = 'documento-legal.pdf') => {
      // 1. Llamada a la API (Si falla, el interceptor avisa y detiene la ejecución)
      const blob = await ContratoGeneralService.downloadRequest(idContratoFirmado);
      
      // 2. Manipulación del DOM (Solo se ejecuta si la descarga fue exitosa)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileNameSugestion);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.remove();
      window.URL.revokeObjectURL(url);
  }
};

export default ContratoGeneralService;