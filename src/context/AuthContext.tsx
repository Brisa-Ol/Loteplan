import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback
} from "react";
import { AxiosError } from "axios";

import type {
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
  LoginResponseDto,
  Generate2faSecretResponse,
  LoginSuccessResponse
} from "../types/dto/auth.dto";
import UsuarioService from "../Services/usuario.service";
import AuthService from "../Services/auth.service";
import Auth2faService from "../Services/auth2fa.service";


interface AuthContextType {
  // Estado del Usuario
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;

  // Estado temporal para Login con 2FA
  requires2FA: boolean;
  twoFaToken: string | null;
  error: string | null;

  // Acciones de Autenticación
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;

  // Gestión de Datos y Seguridad
  refetchUser: () => Promise<void>;
  generate2FASecret: () => Promise<Generate2faSecretResponse>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string, code: string) => Promise<void>;

  // Recuperación
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estados Principales
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Estados 2FA Login
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  
  // Estado de Error
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 1. HELPER DE ERRORES
  // ==========================================
  const handleServiceError = (err: unknown, defaultMsg: string) => {
    let msg = defaultMsg;
    if (err instanceof AxiosError && err.response?.data?.error) {
      msg = err.response.data.error;
    } else if (err instanceof Error) {
      msg = err.message;
    }
    setError(msg);
    // Relanzamos el error para que los componentes (UI) puedan manejarlo
    throw err;
  };

  // ==========================================
  // 2. CARGA INICIAL (Persistencia)
  // ==========================================
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const { data } = await UsuarioService.getMe();
      setUser(data);
    } catch (err) {
      console.error("Sesión inválida o expirada", err);
      localStorage.removeItem("auth_token");
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ==========================================
  // 3. LOGIN Y VERIFICACIÓN
  // ==========================================
  const login = async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.login(credentials);

      // Verificamos si la respuesta indica que se requiere 2FA
      if ('is2FARequired' in data && data.is2FARequired) {
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken);
      } else if ('token' in data) {
        localStorage.setItem("auth_token", data.token);
        await loadUser();
      }

      return data;
    } catch (err) {
      handleServiceError(err, "Error al iniciar sesión");
      throw err; // Necesario para que TypeScript sepa que esta ruta falla
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string): Promise<LoginSuccessResponse> => {
    if (!twoFaToken) throw new Error("No hay token de 2FA disponible");

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.verify2fa({
        twoFaToken,
        token: code
      });

      localStorage.setItem("auth_token", data.token);
      
      setRequires2FA(false);
      setTwoFaToken(null);
      
      await loadUser();

      return data;
    } catch (err) {
      handleServiceError(err, "Código 2FA incorrecto");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 4. LOGOUT & REGISTRO
  // ==========================================
  const logout = () => {
    AuthService.logout().catch(console.error);

    localStorage.clear();
    sessionStorage.clear();

    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
    setError(null);

    // Redirección forzada para limpiar memoria y estados de React Query si se usan
    window.location.href = '/login';
  };

  const register = async (data: RegisterRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.register(data);
    } catch (err) {
      handleServiceError(err, "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 5. GESTIÓN 2FA (Configuración)
  // ==========================================
  const generate2FASecret = async () => {
    try {
      const { data } = await Auth2faService.generateSecret();
      return data;
    } catch (err) {
      handleServiceError(err, "Error generando secreto");
      throw err;
    }
  };

  const enable2FA = async (code: string) => {
    try {
      await Auth2faService.enable({ token: code });
      // Es vital recargar el usuario para que 'is_2fa_enabled' pase a true en la UI
      await loadUser();
    } catch (err) {
      handleServiceError(err, "Error activando 2FA");
    }
  };

  const disable2FA = async (password: string, code: string) => {
    try {
      await Auth2faService.disable({ contraseña: password, token: code });
      await loadUser();
    } catch (err) {
      handleServiceError(err, "Error desactivando 2FA");
    }
  };

  // ==========================================
  // 6. RECUPERACIÓN DE CUENTA
  // ==========================================
  const resendConfirmation = async (email: string) => {
    try {
      await AuthService.resendConfirmation({ email });
    } catch (err) {
      handleServiceError(err, "Error enviando email");
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await AuthService.forgotPassword({ email });
    } catch (err) {
      handleServiceError(err, "Error solicitando recuperación");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        requires2FA,
        twoFaToken,
        error,
        login,
        verify2FA,
        register,
        logout,
        refetchUser: loadUser,
        clearError: () => setError(null),
        generate2FASecret,
        enable2FA,
        disable2FA,
        resendConfirmation,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};