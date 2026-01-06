// src/hooks/auth/useAuthCore.ts
// Core authentication logic: login, logout, register, session management

import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserDto } from '../../types/dto/auth.dto';

import UsuarioService from '../../services/usuario.service';
import AuthService from '../../services/auth.service';
import type { ApiError } from '../../services/httpService';


export interface UseAuthCoreReturn {
    // Estado
    user: UserDto | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;

    // Métodos
    login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
    register: (data: RegisterRequestDto) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<UserDto | null>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    clearError: () => void;
}

export const useAuthCore = (): UseAuthCoreReturn => {
    // Estados
    const [user, setUser] = useState<UserDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Manejador de errores centralizado
    const handleServiceError = useCallback((err: unknown, defaultMsg: string) => {
        let msg = defaultMsg;

        if (err && typeof err === 'object') {
            const apiErr = err as ApiError;

            if (apiErr.type === 'SECURITY_ACTION') {
                msg = `🔐 Requisito de seguridad: ${apiErr.message}`;
            } else if (apiErr.type === 'ROLE_RESTRICTION') {
                msg = `⛔ Permiso denegado: ${apiErr.message}`;
            } else if (apiErr.type === 'RATE_LIMIT') {
                msg = `⏳ ${apiErr.message}`;
            } else if ('message' in apiErr && typeof apiErr.message === 'string') {
                msg = apiErr.message;
            }
        } else if (err instanceof AxiosError && err.response?.data?.error) {
            msg = err.response.data.error;
        } else if (err instanceof Error) {
            msg = err.message;
        }

        setError(msg);
        throw err;
    }, []);

    // Cargar usuario desde token
    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            setIsInitializing(false);
            return;
        }

        try {
            const { data } = await UsuarioService.getMe();
            setUser(data);
        } catch (err) {
            console.warn('Sesión inválida o expirada', err);
            localStorage.removeItem('auth_token');
            setUser(null);
        } finally {
            setIsInitializing(false);
        }
    }, []);

    // Login (retorna respuesta para que 2FA pueda procesarla)
    const login = useCallback(async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await AuthService.login(credentials);

            // Si es login directo (sin 2FA), guardar token
            if ('token' in data && !('is2FARequired' in data)) {
                localStorage.setItem('auth_token', data.token);
                await loadUser();
            }

            return data;
        } catch (err: unknown) {
            const is401 = (err as { status?: number })?.status === 401 ||
                (err as AxiosError)?.response?.status === 401;
            if (is401) {
                const msg = 'Usuario o contraseña incorrectos';
                setError(msg);
                throw err;
            }
            handleServiceError(err, 'Error al iniciar sesión');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadUser, handleServiceError]);

    // Registro
    const register = useCallback(async (data: RegisterRequestDto) => {
        setIsLoading(true);
        setError(null);
        try {
            await AuthService.register(data);
        } catch (err) {
            handleServiceError(err, 'Error en el registro');
        } finally {
            setIsLoading(false);
        }
    }, [handleServiceError]);

    // Logout
    const logout = useCallback(() => {
        AuthService.logout().catch(console.error);
        localStorage.clear();
        sessionStorage.clear();

        setUser(null);
        setError(null);

        window.location.href = '/login';
    }, []);

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
        setUser,
        setError,
        setIsLoading,
        clearError,
    };
};