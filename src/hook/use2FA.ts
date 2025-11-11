// src/hooks/use2FA.ts (ESTE ES EL ARCHIVO NUEVO QUE NECESITAS CREAR)

import { useState } from 'react';
import auth2faService from '../Services/auth2fa.service'; // ⬅️ Importa el servicio


/**
 * Hook para manejar la lógica de estado de la
 * configuración de 2FA (habilitar/deshabilitar).
 */
export const use2FA = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para guardar los datos del secreto
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const clearError = () => setError(null);

  /**
   * Llama al servicio para generar un nuevo secreto 2FA.
   */
  const generateSecret = async (): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    try {
      // Llama al servicio que pegaste
      const response = await auth2faService.generateSecret();
      
      // Guarda los datos en el estado del hook
      setSecret(response.secret);
      setQrCodeUrl(response.otpauthUrl);
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al generar el secreto 2FA.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Llama al servicio para verificar y habilitar 2FA.
   */
  const enable2FA = async (code: string): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    try {
      // Llama al servicio que pegaste
      await auth2faService.enable({ code: code });
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'El código 2FA es incorrecto.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Aquí podrías añadir la función 'disable2FA' si la necesitas
  // const disable2FA = async (data: Disable2FADto) => { ... }

  return {
    isLoading,
    error,
    secret,
    qrCodeUrl,
    generateSecret,
    enable2FA,
    clearError,
    // disable2FA,
  };
};