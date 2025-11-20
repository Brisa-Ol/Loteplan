import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { ContratoFirmadoDto } from '../types/dto/contrato-firmado.dto';

const ContratoGeneralService = {

  // =================================================
  // 📋 LISTADOS Y CONSULTAS
  // =================================================

  /**
   * Obtiene TODOS los contratos firmados del sistema.
   * 🔒 Solo para Administradores.
   */
  findAllSigned: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get('/contratos/');
  },

  /**
   * Obtiene los contratos firmados pertenecientes al usuario logueado.
   * ✅ Uso común: Pantalla "Mis Documentos".
   */
  findMyContracts: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    return await httpService.get('/contratos/mis_contratos');
  },

  /**
   * Obtiene el detalle de un contrato específico por ID.
   * El backend valida si el usuario tiene permiso para verlo.
   */
  findById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`/contratos/${id}`);
  },

  // =================================================
  // ⬇️ DESCARGA SEGURA DE ARCHIVOS
  // =================================================

  /**
   * Petición HTTP para obtener el archivo binario (Blob).
   * ⚠️ Es fundamental configurar 'responseType: blob'.
   */
  downloadRequest: async (idContratoFirmado: number): Promise<Blob> => {
    const response = await httpService.get(`/contratos/descargar/${idContratoFirmado}`, {
      responseType: 'blob' 
    });
    return response.data;
  },

  /**
   * 🚀 FUNCIÓN UTILITARIA PARA EL COMPONENTE
   * Orquesta la descarga completa: Pide el Blob y fuerza al navegador a guardarlo.
   * * @param idContratoFirmado - ID del contrato a descargar
   * @param fileNameSugestion - Nombre sugerido para guardar el archivo (ej: 'contrato-proyecto-x.pdf')
   */
  downloadAndSave: async (idContratoFirmado: number, fileNameSugestion: string = 'documento.pdf') => {
    try {
      // 1. Obtener los datos binarios
      const blob = await ContratoGeneralService.downloadRequest(idContratoFirmado);
      
      // 2. Crear una URL temporal en memoria
      const url = window.URL.createObjectURL(blob);
      
      // 3. Crear un elemento <a> invisible para disparar la descarga
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileNameSugestion); // Forzar nombre de archivo
      document.body.appendChild(link);
      
      // 4. Simular clic y limpiar
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Liberar memoria RAM
    } catch (error) {
      console.error("Error gestionando la descarga:", error);
      throw error; // Re-lanzar para que el componente muestre una alerta
    }
  }
};

export default ContratoGeneralService;