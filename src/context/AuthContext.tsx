// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import authService from "../Services/auth.service";
import { AxiosError } from "axios";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Auth2FARequiredResponse,
  TwoFASetupResponse,
  TwoFAEnableRequest,
  TwoFADisableRequest,
  LoginResponse,
} from "../types/dto/auth.types";

// ══════════════════════════════════════════════════════════
// CONTEXT INTERFACE
// ══════════════════════════════════════════════════════════

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requires2FA: boolean;
  twoFaToken: string | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  clearError: () => void;
  generate2FASecret: () => Promise<TwoFASetupResponse>;
  enable2FA: (data: TwoFAEnableRequest) => Promise<void>;
  disable2FA: (data: TwoFADisableRequest) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ══════════════════════════════════════════════════════════
// PROVIDER
// ══════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(() =>
    authService.get2FAToken()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  // ══════════════════════════════════════════════════════════
  // INTERNAL FUNCTIONS
  // ══════════════════════════════════════════════════════════

  const loadUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (err: unknown, defaultMessage: string): never => {
    const error = err as AxiosError<{ error: string }>;
    const errorMessage = error.response?.data?.error || defaultMessage;
    setError(errorMessage);
    throw err;
  };

  // ══════════════════════════════════════════════════════════
  // PUBLIC FUNCTIONS
  // ══════════════════════════════════════════════════════════

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authService.login(credentials);

      if ("is2FARequired" in response && response.is2FARequired) {
        setRequires2FA(true);
        setTwoFaToken(response.twoFaToken);
        return response;
      }

      await loadUser();
      return response as AuthResponse;
    } catch (err) {
      return handleError(err, "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      if (!twoFaToken) {
        throw new Error("No hay token de 2FA disponible");
      }

      await authService.verify2FA({
        twoFaToken,
        token: code,
      });

      setRequires2FA(false);
      setTwoFaToken(null);

      await loadUser();
    } catch (err) {
      handleError(err, "Código 2FA incorrecto");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.register(data);
    } catch (err) {
      handleError(err, "Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  const generate2FASecret = async (): Promise<TwoFASetupResponse> => {
    try {
      setError(null);
      return await authService.generate2FASecret();
    } catch (err) {
      return handleError(err, "Error al generar código 2FA");
    }
  };

  const enable2FA = async (data: TwoFAEnableRequest): Promise<void> => {
    try {
      setError(null);
      await authService.enable2FA(data);
      await refetchUser();
    } catch (err) {
      handleError(err, "Error al habilitar 2FA");
    }
  };

  const disable2FA = async (data: TwoFADisableRequest): Promise<void> => {
    try {
      setError(null);
      await authService.disable2FA(data);
      await refetchUser();
    } catch (err) {
      handleError(err, "Error al deshabilitar 2FA");
    }
  };

  const resendConfirmation = async (email: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.resendConfirmation({ email });
    } catch (err) {
      handleError(err, "Error al reenviar el email");
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.forgotPassword({ email });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      const errorMessage = error.response?.data?.error || "Error al procesar la solicitud";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
  };

  const refetchUser = async () => {
    await loadUser();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        requires2FA,
        twoFaToken,
        error,
        login,
        verify2FA,
        register,
        logout,
        refetchUser,
        clearError,
        generate2FASecret,
        enable2FA,
        disable2FA,
        resendConfirmation,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ══════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};