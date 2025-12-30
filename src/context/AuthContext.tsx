import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback
} from "react";
import { AxiosError } from "axios";

// --- DTOs ---
import type {
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
  LoginResponseDto,
  LoginSuccessResponse
} from "../types/dto/auth.dto";

import type { 
  Generate2faSecretResponseDto 
} from "../types/dto/auth2fa.dto";

// --- SERVICIOS ---
import UsuarioService from "../Services/usuario.service";
import AuthService from "../Services/auth.service";
import Auth2faService from "../Services/auth2fa.service"; // ✅ Servicio dedicado

// --- TIPOS DE ERROR ---
import type { ApiError } from "../Services/httpService";

// Definición del Contexto
interface AuthContextType {
  // Estado del Usuario
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  
  // Estado para Login con 2FA
  requires2FA: boolean;
  twoFaToken: string | null;
  
  // Manejo de Errores
  error: string | null;
  clearError: () => void;

  // Métodos de Autenticación
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;

  // Métodos de Gestión 2FA (Perfil)
  generate2FASecret: () => Promise<Generate2faSecretResponseDto>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string, code: string) => Promise<void>;

  // Métodos de Gestión de Cuenta
  deleteAccount: (twofaCode?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Login Flow
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  
  // Feedback
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 2. MANEJADOR DE ERRORES
  // ==========================================
  const handleServiceError = (err: unknown, defaultMsg: string) => {
    let msg = defaultMsg;

    // A. Error personalizado de httpService (ApiError)
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
    }
    // B. Error de Axios estándar
    else if (err instanceof AxiosError && err.response?.data?.error) {
      msg = err.response.data.error;
    } 
    // C. Error genérico JS
    else if (err instanceof Error) {
      msg = err.message;
    }

    setError(msg);
    throw err; // Re-lanzar para que el componente también se entere si es necesario
  };

  // ==========================================
  // 3. CARGA INICIAL (Session Check)
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
      console.warn("Sesión inválida o expirada", err);
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
  // 4. LOGIN & VERIFY (Flujo Smart 2FA)
  // ==========================================
  
  const login = async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Llamada al backend
      const { data } = await AuthService.login(credentials);

      // 2. Caso A: Requiere 2FA (Status 202)
      if ('is2FARequired' in data && data.is2FARequired) {
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken); // Guardamos el token temporal en memoria
      } 
      // 3. Caso B: Login Directo (Status 200)
      else if ('token' in data) {
        localStorage.setItem("auth_token", data.token);
        await loadUser();
      }

      return data;
    } catch (err: any) {
      // Manejo especial para 401 en Login (Credenciales vs Token Expirado)
      const is401 = err?.status === 401 || err?.response?.status === 401;
      if (is401) {
        const msg = "Usuario o contraseña incorrectos";
        setError(msg);
        throw err;
      }
      handleServiceError(err, "Error al iniciar sesión");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string): Promise<LoginSuccessResponse> => {
    if (!twoFaToken) {
        const err = new Error("No hay token de sesión temporal. Vuelva a iniciar sesión.");
        setError(err.message);
        throw err;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Llamamos a AuthService porque es parte del flujo de autenticación (login)
      const { data } = await AuthService.verify2fa({
        twoFaToken,
        token: code
      });

      // Éxito: Guardamos token final
      localStorage.setItem("auth_token", data.token);
      setRequires2FA(false);
      setTwoFaToken(null);
      await loadUser();

      return data;
    } catch (err) {
      handleServiceError(err, "Código 2FA incorrecto o expirado");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 5. GESTIÓN 2FA (Perfil de Usuario)
  // ==========================================
  
  // Usa Auth2faService
  const generate2FASecret = async (): Promise<Generate2faSecretResponseDto> => {
    try {
      const { data } = await Auth2faService.generateSecret();
      return data;
    } catch (err) {
      handleServiceError(err, "Error generando secreto 2FA");
      throw err;
    }
  };

  // Usa Auth2faService
  const enable2FA = async (code: string) => {
    try {
      await Auth2faService.enable({ token: code });
      await loadUser(); // Refrescar user.is_2fa_enabled a true
    } catch (err) {
      handleServiceError(err, "Error activando 2FA. Verifique el código.");
      throw err;
    }
  };

  // Usa Auth2faService
  const disable2FA = async (password: string, code: string) => {
    try {
      await Auth2faService.disable({ contraseña: password, token: code });
      await loadUser(); // Refrescar user.is_2fa_enabled a false
    } catch (err) {
      handleServiceError(err, "Error desactivando 2FA. Verifique contraseña y código.");
      throw err;
    }
  };

  // ==========================================
  // 6. GESTIÓN DE CUENTA (Registro, Logout, etc)
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

  const logout = () => {
    AuthService.logout().catch(console.error); // Llamada "fire and forget" al back
    localStorage.clear();
    sessionStorage.clear();
    
    // Resetear estados
    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
    setError(null);
    
    // Redirección forzada
    window.location.href = '/login';
  };

  const deleteAccount = async (twofaCode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // El servicio de usuario maneja el soft-delete, pasando opcionalmente el código 2FA
      await UsuarioService.softDeleteMe(twofaCode);
      logout();
    } catch (err) {
      handleServiceError(err, "Error al desactivar la cuenta");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      await AuthService.resendConfirmation({ email });
    } catch (err) {
      handleServiceError(err, "Error enviando email de confirmación");
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

  // ==========================================
  // 7. RENDER PROVIDER
  // ==========================================
  return (
    <AuthContext.Provider
      value={{
        // Estado
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        requires2FA,
        twoFaToken,
        error,
        
        // Métodos Auth
        login,
        verify2FA,
        register,
        logout,
        refetchUser: loadUser,
        
        // Métodos 2FA (Gestión)
        generate2FASecret,
        enable2FA,
        disable2FA,
        
        // Métodos Cuenta
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