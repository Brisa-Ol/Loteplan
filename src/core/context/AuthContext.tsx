import React, {
  createContext,
  useEffect,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';

// DTOs (Asumiendo que existen en tu proyecto)
import type { LoginRequestDto, RegisterRequestDto, UserDto, LoginResponseDto, LoginSuccessResponse } from '@/core/types/dto/auth.dto';
import type { Generate2faSecretResponseDto } from '@/core/types/dto/auth2fa.dto';

// Hooks
import { use2FAManagement } from '@/features/auth/hooks/use2FAManagement';
import { useAccountActions } from '@/features/auth/hooks/useAccountActions';
import { useAuthCore } from '@/features/auth/hooks/useAuthCore';

export type AuthErrorType = 
  | 'invalid_credentials' 
  | 'session_expired' 
  | 'account_not_activated' 
  | 'generic' 
  | null;

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  requires2FA: boolean;
  twoFaToken: string | null;
  error: string | null;
  authErrorType: AuthErrorType;
  clearError: () => void;
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  logout: () => void;
  register: (data: RegisterRequestDto) => Promise<void>;
  refetchUser: () => Promise<void>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  generate2FASecret: () => Promise<Generate2faSecretResponseDto>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string, code: string) => Promise<void>;
  deleteAccount: (twofaCode?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔍 HELPER DE CLASIFICACIÓN (Sincronizado con tu Backend)
const classifyError = (errorMsg: string | null): AuthErrorType => {
  if (!errorMsg) return null;
  const errorLower = errorMsg.toLowerCase();

  // Backend: "Cuenta no activada." (Viene como 403, pero el texto manda)
  if (errorLower.includes('cuenta no activada') || 
      errorLower.includes('no confirmado') ||
      errorLower.includes('email no verificado')) {
    return 'account_not_activated';
  }

  // Backend: "Credenciales incorrectas." (Viene como 401)
  if (errorLower.includes('credenciales incorrectas') ||
      errorLower.includes('usuario o contraseña') ||
      errorLower.includes('invalid credentials')) {
    return 'invalid_credentials';
  }

  // Frontend: Sesión expirada por interceptor
  if (errorLower.includes('sesión expirada') || errorLower.includes('token expirado')) {
    return 'session_expired';
  }

  return 'generic';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authCore = useAuthCore();
  const twoFA = use2FAManagement();
  const accountActions = useAccountActions(authCore.logout);
  const [authErrorType, setAuthErrorType] = useState<AuthErrorType>(null);
  const { loadUser } = authCore;

  useEffect(() => { loadUser(); }, [loadUser]);

  const combinedError = authCore.error || twoFA.error || accountActions.error;
  const isLoading = authCore.isLoading || twoFA.isLoading || accountActions.isLoading;

  // Clasificar error automáticamente
  useEffect(() => {
    setAuthErrorType(classifyError(combinedError));
  }, [combinedError]);

  const login = useCallback(async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    // Limpiamos errores previos al intentar loguear
    authCore.clearError(); 
    setAuthErrorType(null);
    
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
    setAuthErrorType(null);
  }, [twoFA, authCore]);

  const clearError = useCallback(() => {
    authCore.clearError();
    twoFA.clearError();
    accountActions.clearError();
    setAuthErrorType(null);
  }, [authCore, twoFA, accountActions]);

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
        authErrorType,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};