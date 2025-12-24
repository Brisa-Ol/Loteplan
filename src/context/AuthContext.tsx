import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback
} from "react";
import { AxiosError } from "axios";

// DTOs
import type {
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
  LoginResponseDto,
  Generate2faSecretResponse,
  LoginSuccessResponse
} from "../types/dto/auth.dto";

// Servicios
import UsuarioService from "../Services/usuario.service";
import AuthService from "../Services/auth.service";
import Auth2faService from "../Services/auth2fa.service";

// Tipos de Error
import type { ApiError } from "../Services/httpService";

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
  deleteAccount: (twofaCode?: string) => Promise<void>;
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
  
  // Estados para Login con 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  
  // Estado de Error
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 🔧 MANEJADOR DE ERRORES CENTRALIZADO
  // ==========================================
  const handleServiceError = (err: unknown, defaultMsg: string) => {
    let msg = defaultMsg;

    // Verificamos si es nuestro error personalizado (ApiError)
    if (err && typeof err === 'object') {
       // Casteamos de forma segura chequeando propiedades
       const apiErr = err as ApiError;
       
       if (apiErr.type === 'SECURITY_ACTION') {
         msg = `🔐 Requisito de seguridad: ${apiErr.message}`;
       } else if (apiErr.type === 'ROLE_RESTRICTION') {
         msg = `⛔ Permiso denegado: ${apiErr.message}`;
       } else if (apiErr.type === 'RATE_LIMIT') {
         msg = `⏳ ${apiErr.message}`;
       } else if ('message' in apiErr) {
         // Si el interceptor ya puso un mensaje (ej: "Sesión expirada"), lo tomamos
         // PERO: Esto es lo que queremos evitar en el login.
         msg = apiErr.message;
       }
    }
    // Error de Axios estándar (por si el interceptor falló o es otro tipo)
    else if (err instanceof AxiosError && err.response?.data?.error) {
      msg = err.response.data.error;
    } 
    else if (err instanceof Error) {
      msg = err.message;
    }

    setError(msg);
    throw err;
  };

  // ==========================================
  // 🔄 CARGA INICIAL
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
  // 🔐 LOGIN (AQUÍ ESTÁ LA CORRECCIÓN)
  // ==========================================
  const login = async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.login(credentials);

      if ('is2FARequired' in data && data.is2FARequired) {
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken);
      } 
      else if ('token' in data) {
        localStorage.setItem("auth_token", data.token);
        await loadUser();
      }

      return data;
    } catch (err: any) {
      // ⚠️ CORRECCIÓN ESPECÍFICA PARA LOGIN
      // El interceptor convierte el 401 en "Sesión expirada".
      // Aquí detectamos si es un 401 y forzamos el mensaje correcto.
      
      const is401 = err?.status === 401 || err?.response?.status === 401;

      if (is401) {
        const msg = "Usuario o contraseña incorrectos";
        setError(msg);
        // Lanzamos el error para detener la ejecución, pero el estado ya tiene el mensaje correcto
        throw err;
      }
      
      // Si no es 401 (ej: error 500, error de red), usamos el manejador normal
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
  // 🚪 LOGOUT
  // ==========================================
  const logout = () => {
    AuthService.logout().catch(console.error);
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
    setError(null);
    window.location.href = '/';
  };

  // ==========================================
  // 📝 REGISTRO
  // ==========================================
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
  // 🛡️ GESTIÓN DE SEGURIDAD
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
      await loadUser();
    } catch (err) {
      handleServiceError(err, "Error activando 2FA");
      throw err;
    }
  };

  const disable2FA = async (password: string, code: string) => {
    try {
      await Auth2faService.disable({ contraseña: password, token: code });
      await loadUser();
    } catch (err) {
      handleServiceError(err, "Error desactivando 2FA");
      throw err;
    }
  };

  const deleteAccount = async (twofaCode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await UsuarioService.softDeleteMe(twofaCode);
      logout();
    } catch (err) {
      handleServiceError(err, "Error al desactivar la cuenta");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 📧 RECUPERACIÓN Y OTROS
  // ==========================================
  const resendConfirmation = async (email: string) => {
    try {
      await AuthService.resendConfirmation({ email });
    } catch (err) {
      handleServiceError(err, "Error enviando email");
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await AuthService.forgotPassword({ email });
    } catch (err) {
      handleServiceError(err, "Error solicitando recuperación");
      throw err;
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
        generate2FASecret,
        enable2FA,
        disable2FA,
        deleteAccount,
        resendConfirmation,
        forgotPassword,
        clearError: () => setError(null),
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