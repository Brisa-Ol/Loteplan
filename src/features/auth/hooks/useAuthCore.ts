import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { secureStorage } from '@/shared/utils/secureStorage';
import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserDto } from '@/core/types/dto/auth.dto';
import type { ApiError } from '@/core/api/httpService';

// Servicios
import UsuarioService from '@/core/api/services/usuario.service';
import AuthService from '@/core/api/services/auth.service';
import kycService from '@/core/api/services/kyc.service';

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

  // 🚀 CARGA DE USUARIO + KYC (Combinados)
  const loadUser = useCallback(async () => {
    const token = secureStorage.getToken();

    // Si no hay token, cortamos la inicialización
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      // 1. Obtenemos datos base del usuario
      const { data: userData } = await UsuarioService.getMe();

      // Creamos una copia para mutarla con el estado KYC
      let fullUser: UserDto = { ...userData };

      // 2. Si es CLIENTE, buscamos su estado de KYC
      if (userData.rol === 'cliente') {
        try {
          // ✅ CORRECTO: El servicio ya devuelve la data limpia, no desestructuramos
          const kycData = await kycService.getStatus();

          // Agregamos el estado al objeto de usuario
          fullUser = {
            ...userData,
            estado_kyc: kycData.estado_verificacion
          };
        } catch (kycError) {
          // Si falla (ej: 404 porque nunca inició), asumimos NO_INICIADO
          console.warn("No se pudo obtener estado KYC, asumiendo NO_INICIADO", kycError);

          // ✅ TypeScript ya no se queja porque actualizamos UserDto en auth.dto.ts
          fullUser = {
            ...userData,
            estado_kyc: 'NO_INICIADO'
          };
        }
      }

      setUser(fullUser);

    } catch (err) {
      console.warn('Sesión inválida o expirada', err);
      // Si falla obtener el usuario base, limpiamos todo
      secureStorage.clearToken();
      setUser(null);
      queryClient.clear();
    } finally {
      setIsInitializing(false);
    }
  }, [queryClient]);

  // LOGIN
  const login = useCallback(async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.login(credentials);

      // Si es login exitoso directo (sin 2FA), guardamos sesión y cargamos datos
      if ('token' in data && !('is2FARequired' in data)) {
        secureStorage.setToken(data.token);
        // Llamamos a loadUser para que traiga Usuario + KYC
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

  // REGISTRO
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

  // LOGOUT (Hard Reload)
  const logout = useCallback(() => {
    AuthService.logout().catch(console.error);

    secureStorage.clearToken();
    sessionStorage.clear();
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