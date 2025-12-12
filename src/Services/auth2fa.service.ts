import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { 
  Generate2faSecretResponseDto, 
  Enable2faRequestDto, 
  Disable2faRequestDto 
} from '../types/dto/auth2fa.dto';
import type { GenericResponseDto } from '../types/dto/auth.dto';


const Auth2faService = {
  
  /**
   * Paso 1: Generar el secreto y obtener la URL para el QR.
   * El usuario debe estar logueado.
   */
  generateSecret: async (): Promise<AxiosResponse<Generate2faSecretResponseDto>> => {
    // Asumo que la ruta base es /auth según tus rutas anteriores
    return await httpService.post('/auth/2fa/generate-secret');
  },

  /**
   * Paso 2: Verificar el código TOTP y activar el 2FA en la BD.
   */
  enable: async (data: Enable2faRequestDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/2fa/enable', data);
  },

  /**
   * Desactivar 2FA (Requiere contraseña y código actual).
   */
  disable: async (data: Disable2faRequestDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/2fa/disable', data);
  },

  /**
   * 💡 HELPER UTILITARIO (No es una llamada a API)
   * Si usas una librería como 'qrcode' en el front, esto es un ejemplo
   * de cómo se usaría en tu componente, no en el servicio HTTP.
   */
  // generateQrCodeImage: async (otpauthUrl: string) => {
  //   import QRCode from 'qrcode';
  //   return await QRCode.toDataURL(otpauthUrl);
  // }
};

export default Auth2faService;