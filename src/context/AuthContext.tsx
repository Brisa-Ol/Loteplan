// src/context/AuthContext.tsx
import React, {
  createContext,
  useEffect,
  useContext,
  useCallback, // 1. Agregado para memorizar funciones
  type ReactNode,
} from 'react';

import type {
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
  LoginResponseDto,
  LoginSuccessResponse,
} from '../types/dto/auth.dto';

import type {
  Generate2faSecretResponseDto
} from '../types/dto/auth2fa.dto';

import { useAuthCore } from '../hooks/auth/useAuthCore';
import { useAccountActions } from '../hooks/auth/useAccountActions';
import { use2FAManagement } from '../hooks/auth/use2FAManagement';

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  requires2FA: boolean;
  twoFaToken: string | null;
  error: string | null;
  clearError: () => void;
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  generate2FASecret: () => Promise<Generate2faSecretResponseDto>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string, code: string) => Promise<void>;
  deleteAccount: (twofaCode?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authCore = useAuthCore();
  const twoFA = use2FAManagement();
  const accountActions = useAccountActions(authCore.logout);

  // ==========================================
  // CARGA INICIAL (Corrección de Dependencias)
  // ==========================================
  // ✅ 2. Se extrae la función loadUser de authCore para usarla como dependencia estable
  const { loadUser } = authCore;

  useEffect(() => {
    loadUser();
  }, [loadUser]); // Ahora la dependencia es estable

  // ==========================================
  // MÉTODOS COMPUESTOS (Memorizados con useCallback)
  // ==========================================

  // ✅ 3. Envolvemos en useCallback para evitar renders innecesarios en componentes hijos
  const login = useCallback(async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    const response = await authCore.login(credentials);
    if ('is2FARequired' in response && response.is2FARequired) {
      twoFA.setRequires2FA(true);
      twoFA.setTwoFaToken(response.twoFaToken);
    }
    return response;
  }, [authCore, twoFA]);

  const verify2FA = useCallback(async (code: string): Promise<LoginSuccessResponse> => {
    return twoFA.verify2FA(code, authCore.loadUser);
  }, [twoFA, authCore.loadUser]);

  const enable2FA = useCallback(async (code: string): Promise<void> => {
    await twoFA.enable2FA(code, authCore.loadUser);
  }, [twoFA, authCore.loadUser]);

  const disable2FA = useCallback(async (password: string, code: string): Promise<void> => {
    await twoFA.disable2FA(password, code, authCore.loadUser);
  }, [twoFA, authCore.loadUser]);

  const logout = useCallback(() => {
    twoFA.reset2FAState();
    authCore.logout();
  }, [twoFA, authCore]);

  const clearError = useCallback(() => {
    authCore.clearError();
    twoFA.clearError();
    accountActions.clearError();
  }, [authCore, twoFA, accountActions]);

  const combinedError = authCore.error || twoFA.error || accountActions.error;
  const isLoading = authCore.isLoading || twoFA.isLoading || accountActions.isLoading;

  return (
    <AuthContext.Provider
      value={{
        user: authCore.user,
        isAuthenticated: authCore.isAuthenticated,
        isLoading,
        isInitializing: authCore.isInitializing,
        requires2FA: twoFA.requires2FA,
        twoFaToken: twoFA.twoFaToken,
        error: combinedError,
        login,
        verify2FA,
        register: authCore.register,
        logout,
        refetchUser: authCore.loadUser,
        generate2FASecret: twoFA.generate2FASecret,
        enable2FA,
        disable2FA,
        deleteAccount: accountActions.deleteAccount,
        resendConfirmation: accountActions.resendConfirmation,
        forgotPassword: accountActions.forgotPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};