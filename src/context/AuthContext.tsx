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

// Tipos de Error (Importado de tu httpService)
import type { ApiError } from "../Services/httpService";

interface AuthContextType {
  // Estado del Usuario
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  
  // Estado 2FA (Login)
  requires2FA: boolean;
  twoFaToken: string | null;
  
  // Manejo de Errores Global
  error: string | null;
  
  // Métodos de Autenticación
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  
  // Métodos de Configuración de Seguridad (Perfil)
  generate2FASecret: () => Promise<Generate2faSecretResponse>;
  enable2FA: (code: string) => Promise<void>;
  disable2FA: (password: string, code: string) => Promise<void>;
  
  // 🆕 Método de Desactivación de Cuenta
  deleteAccount: (twofaCode?: string) => Promise<void>;
  
  // Métodos de Recuperación
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  
  // Utilidades
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

    // 1. Error Personalizado (ApiError desde httpService)
    // Verificamos si tiene la estructura de ApiError
    if (err && typeof err === 'object' && 'type' in err) {
      const apiErr = err as ApiError;
      
      // Personalizamos el mensaje según el tipo
      if (apiErr.type === 'SECURITY_ACTION') {
        msg = `🔐 Requisito de seguridad: ${apiErr.message}`;
      } else if (apiErr.type === 'ROLE_RESTRICTION') {
        msg = `⛔ Permiso denegado: ${apiErr.message}`;
      } else if (apiErr.type === 'RATE_LIMIT') {
        msg = `⏳ ${apiErr.message}`;
      } else {
        msg = apiErr.message;
      }
    }
    // 2. Error de Axios Estándar (si se escapó del interceptor o estructura diferente)
    else if (err instanceof AxiosError && err.response?.data?.error) {
      msg = err.response.data.error;
    } 
    // 3. Error genérico JS
    else if (err instanceof Error) {
      msg = err.message;
    }

    setError(msg);
    // Relanzamos el error para que el componente (ej: Modal) pueda manejar lógica específica
    // como cerrar el modal o limpiar inputs si es necesario.
    throw err;
  };

  // ==========================================
  // 🔄 CARGA INICIAL (Persistencia de Sesión)
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
      // Si falla getMe, limpiamos todo porque el token no sirve
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

      // CASO A: Backend requiere 2FA (Paso intermedio)
      if ('is2FARequired' in data && data.is2FARequired) {
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken);
      } 
      // CASO B: Login directo exitoso
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
      
      // Limpiar estados temporales
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

    localStorage.clear(); // Limpia token y datos
    sessionStorage.clear();

    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
    setError(null);

    // Redirección forzada para limpiar estados de memoria de la app
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
  // 🛡️ GESTIÓN DE SEGURIDAD (Perfil)
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
      await loadUser(); // Recargar usuario para que is_2fa_enabled sea true
    } catch (err) {
      handleServiceError(err, "Error activando 2FA");
      throw err;
    }
  };

  const disable2FA = async (password: string, code: string) => {
    try {
      await Auth2faService.disable({ contraseña: password, token: code });
      await loadUser(); // Recargar usuario para que is_2fa_enabled sea false
    } catch (err) {
      handleServiceError(err, "Error desactivando 2FA");
      throw err;
    }
  };

  // ==========================================
  // 💀 DESACTIVACIÓN DE CUENTA (Soft Delete)
  // ==========================================
  const deleteAccount = async (twofaCode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Llamamos al servicio pasando el código 2FA si existe
      await UsuarioService.softDeleteMe(twofaCode);
      
      // Si la desactivación es exitosa, cerramos sesión
      logout();
    } catch (err) {
      // El backend puede devolver 403 si el código 2FA es incorrecto o falta
      // O 409 si hay suscripciones activas.
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
        deleteAccount, // ✅ Agregado correctamente
        
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