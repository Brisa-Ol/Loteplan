import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import { generateFileHash } from '../utils/crypto.utils'; 
import type { 
  RegistrarFirmaRequestDto, 
  ContratoFirmadoResponseDto 
} from '../types/dto/contrato.dto';

const ContratoFirmadoService = {

  /**
   * 🔒 FIRMA DE CONTRATO
   * - Calcula Hash (Integridad)
   * - Envía 2FA (Seguridad)
   * - Backend auto-detecta la inversión/suscripción
   */
  registrarFirma: async (data: RegistrarFirmaRequestDto): Promise<AxiosResponse<ContratoFirmadoResponseDto>> => {
    
    // 1. Calcular Hash SHA-256 (Requisito Crítico del Backend)
    const hashCalculado = await generateFileHash(data.file);

    // 2. Construir FormData
    const formData = new FormData();
    formData.append('file', data.file); 
    
    // IDs Contextuales
    formData.append('id_contrato_plantilla', data.id_contrato_plantilla.toString());
    formData.append('id_proyecto', data.id_proyecto.toString());
    formData.append('id_usuario_firmante', data.id_usuario_firmante.toString());
    
    // Seguridad y Auditoría
    formData.append('hash_archivo_firmado', hashCalculado); 
    formData.append('codigo_2fa', data.codigo_2fa); 
    
    if (data.latitud_verificacion) formData.append('latitud_verificacion', data.latitud_verificacion);
    if (data.longitud_verificacion) formData.append('longitud_verificacion', data.longitud_verificacion);

    // 3. Enviar a la ruta correcta definida en routes/contratoRoutes.js
    // Router base: /api/contratos + Ruta hija: /firmar
    return await httpService.post('/contratos/firmar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Helper de Geolocalización para usar antes de llamar a registrarFirma
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
        () => resolve(null) // Si falla o deniega permiso, continuamos sin geo
      );
    });
  }
};

export default ContratoFirmadoService;