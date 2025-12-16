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
import type { CustomError } from "../Services/httpService";

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  requires2FA: boolean;
  twoFaToken: string | null;
  error: string | null;
  
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  
  generate2FASecret: () => Promise<Generate2faSecretResponse>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string, code: string) => Promise<void>;
  
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Estados para Login con 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 🔧 HELPER MEJORADO DE ERRORES
  // ==========================================
  const handleServiceError = (err: unknown, defaultMsg: string) => {
    let msg = defaultMsg;

    // 1. Error Personalizado (Interceptor)
    if (err && typeof err === 'object' && 'type' in err) {
      const customErr = err as CustomError;
      msg = customErr.message;
      
      if (customErr.type === 'SECURITY_ACTION') {
        msg = `🔐 ${customErr.message}`;
      } else if (customErr.type === 'ROLE_RESTRICTION') {
        msg = `⛔ ${customErr.message}`;
      }
    }
    // 2. Error de Axios (Backend standard)
    else if (err instanceof AxiosError && err.response?.data?.error) {
      msg = err.response.data.error;
    } 
    // 3. Error genérico JS
    else if (err instanceof Error) {
      msg = err.message;
    }

    setError(msg);
    throw err;
  };

  // ==========================================
  // 🔄 CARGA INICIAL (Persistencia)
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
  // 🔐 LOGIN Y VERIFICACIÓN
  // ==========================================
  const login = async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.login(credentials);

      // A) Requiere 2FA (Paso intermedio)
      if ('is2FARequired' in data && data.is2FARequired) {
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken);
      } 
      // B) Login directo (Token final)
      else if ('token' in data) {
        localStorage.setItem("auth_token", data.token);
        await loadUser();
      }

      return data;
    } catch (err) {
      handleServiceError(err, "Error al iniciar sesión");
      throw err;
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
  // 🚪 LOGOUT & REGISTRO
  // ==========================================
  const logout = () => {
    AuthService.logout().catch(console.error);

    localStorage.clear();
    sessionStorage.clear();

    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
    setError(null);

    // Redirección segura
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
  // 🔐 GESTIÓN 2FA (Configuración)
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
      await loadUser(); // Recargar para actualizar is_2fa_enabled en el user state
    } catch (err) {
      handleServiceError(err, "Error activando 2FA");
    }
  };

  const disable2FA = async (password: string, code: string) => {
    try {
      await Auth2faService.disable({ contraseña: password, token: code });
      await loadUser(); // Recargar para actualizar is_2fa_enabled
    } catch (err) {
      handleServiceError(err, "Error desactivando 2FA");
    }
  };

  // ==========================================
  // 📧 RECUPERACIÓN DE CUENTA
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