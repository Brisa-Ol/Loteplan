// src/hooks/use2FA.ts
// (Corregido el campo 'code' por 'token')

import { useState } from 'react';
import auth2faService from '../Services/auth2fa.service';

// ❗ Asumo que el servicio está en 'Services' (Mayúscula) como en tu AdminDashboard
// Si está en 'services' (minúscula), ajusta la ruta de importación.

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
      const response = await auth2faService.generateSecret();
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
      // ❗ CORRECCIÓN: El DTO espera 'token', no 'code'.
      await auth2faService.enable({ token: code });

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