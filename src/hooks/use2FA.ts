// src/hooks/use2FA.ts
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const use2FA = () => {
  const { generate2FASecret, enable2FA: enable2FAContext } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Datos del QR
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const clearError = () => setError(null);

  const generateSecret = async (): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    try {
      const data = await generate2FASecret();
      if (data) {
        setSecret(data.secret);
        setQrCodeUrl(data.otpauthUrl);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async (token: string): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    try {
      await enable2FAContext(token);
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    secret,
    qrCodeUrl,
    generateSecret,
    enable2FA,
    clearError
  };
};