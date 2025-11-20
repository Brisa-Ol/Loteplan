import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import { generateFileHash } from '../utils/crypto.utils'; // Importa la utilidad creada arriba
import type { 
  RegistrarFirmaRequestDto, 
  ContratoFirmadoResponseDto,
  ContratoFirmadoDto
} from '../types/dto/contrato-firmado.dto';

const ContratoFirmadoService = {

  /**
   * Proceso completo de firma:
   * 1. Calcula el Hash SHA-256 del archivo en el cliente.
   * 2. Prepara el FormData con el archivo, el hash, el 2FA y los datos.
   * 3. Envía al backend.
   */
  registrarFirma: async (data: RegistrarFirmaRequestDto): Promise<AxiosResponse<ContratoFirmadoResponseDto>> => {
    
    // 1. Calcular Hash de seguridad (Requisito del Backend)
    const hashCalculado = await generateFileHash(data.file);

    // 2. Preparar FormData
    const formData = new FormData();
    formData.append('file', data.file); // Multer busca esto
    
    // IDs obligatorios
    formData.append('id_contrato_plantilla', data.id_contrato_plantilla.toString());
    formData.append('id_proyecto', data.id_proyecto.toString());
    formData.append('id_usuario_firmante', data.id_usuario_firmante.toString());
    
    // Seguridad y Auditoría
    formData.append('hash_archivo_firmado', hashCalculado); // Hash para validación integridad
    formData.append('codigo_2fa', data.codigo_2fa); // Requerido
    
    if (data.latitud_verificacion) {
      formData.append('latitud_verificacion', data.latitud_verificacion);
    }
    if (data.longitud_verificacion) {
      formData.append('longitud_verificacion', data.longitud_verificacion);
    }

    // 3. Enviar (El Content-Type se setea auto a multipart/form-data por axios al ver FormData, 
    // pero puedes forzarlo si tu config de axios es estricta)
    return await httpService.post('/contratos/firmar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Obtiene el historial de contratos firmados del usuario
   */
  getMySignedContracts: async (): Promise<AxiosResponse<ContratoFirmadoDto[]>> => {
    // Asumo que esta ruta existe basada en el código anterior
    return await httpService.get('/contratos/mis_contratos');
  },

  /**
   * Obtiene un contrato firmado específico por ID
   */
  getById: async (id: number): Promise<AxiosResponse<ContratoFirmadoDto>> => {
    return await httpService.get(`/contratos/${id}`);
  },

  /**
   * Helper para obtener geolocalización del navegador (Promisified)
   * Úsalo en tu componente antes de llamar a registrarFirma.
   */
  getCurrentPosition: (): Promise<{ lat: string, lng: string } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString()
        }),
        (err) => {
          console.warn('No se pudo obtener geolocalización', err);
          resolve(null); // No bloqueamos la firma si falla el GPS, el backend acepta nulos
        }
      );
    });
  }
};

export default ContratoFirmadoService;