import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { ApiError } from '@/core/api/httpService';
import { secureStorage } from '@/core/auth/storage/secureStorage';
import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserDto } from '@/core/types/dto/auth.dto';

import AuthService from '@/core/api/services/auth.service';
import kycService from '@/core/api/services/kyc.service';
import UsuarioService from '@/core/api/services/usuario.service';

export interface UseAuthCoreReturn {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthCore = (): UseAuthCoreReturn => {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractErrorMessage = (err: unknown): string => {
    const apiError = err as ApiError;
    return apiError.message || 'Error desconocido en la operación';
  };

  // ✅ loadUser — cerrado correctamente
  const loadUser = useCallback(async () => {
    const token = secureStorage.getToken();

    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const { data: userData } = await UsuarioService.getMe();

      let fullUser: UserDto = { ...userData };

      if (userData.rol === 'cliente') {
        try {
          const kycData = await kycService.getStatus();
          fullUser = { ...userData, estado_kyc: kycData.estado_verificacion };
        } catch (kycError) {
          console.warn("No se pudo obtener estado KYC, asumiendo NO_INICIADO", kycError);
          fullUser = { ...userData, estado_kyc: 'NO_INICIADO' };
        }
      }

      setUser(fullUser);

    } catch (err) {
      console.warn('Sesión inválida o expirada', err);
      secureStorage.clearToken();
      setUser(null);
      queryClient.clear();

      // ✅ Corrección: avisar al usuario si el token expiró al arrancar
      if (!window.location.pathname.includes('/login')) {
        sessionStorage.setItem('session_expired', 'true');
        window.location.href = '/login';
      }
    } finally {
      setIsInitializing(false);
    }
  }, [queryClient]); // ✅ loadUser cierra aquí

  // ✅ login — separado de loadUser
  const login = useCallback(async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.login(credentials);

      if ('token' in data && !('is2FARequired' in data)) {
        secureStorage.setToken(data.token);
        await loadUser();
      }

      return data;
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadUser]);

  // ✅ register
  const register = useCallback(async (data: RegisterRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.register(data);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ logout — una sola vez, fuera de loadUser
  const logout = useCallback(() => {
    AuthService.logout().catch(console.error);

    secureStorage.clearToken();

    const sessionExpiredFlag = sessionStorage.getItem('session_expired');
    sessionStorage.clear();
    if (sessionExpiredFlag) {
      sessionStorage.setItem('session_expired', sessionExpiredFlag);
    }

    queryClient.clear();
    setUser(null);
    setError(null);

    window.location.href = '/login';
  }, [queryClient]);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitializing,
    error,
    login,
    register,
    logout,
    loadUser,
    clearError,
  };
};