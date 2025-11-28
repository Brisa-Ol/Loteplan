import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback
} from "react";
import { AxiosError } from "axios";

// 1. Importamos los DTOs correctos
import type { 
  LoginRequestDto, 
  RegisterRequestDto, 
  UserDto, 
  LoginResponseDto,
  Generate2faSecretResponse,
  LoginSuccessResponse
} from "../types/dto/auth.dto";

// 2. Importamos tus TRES servicios separados
import UsuarioService from "../Services/usuario.service";
import AuthService from "../Services/auth.service";
import Auth2faService from "../Services/auth2fa.service";


interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean; // 🆕 NUEVO ESTADO PARA CARGA INICIAL
  
  // Estado 2FA temporal (para el flujo de Login)
  requires2FA: boolean;
  twoFaToken: string | null;
  
  error: string | null;
  
  // Acciones Principales
  login: (credentials: LoginRequestDto) => Promise<LoginResponseDto>;
  verify2FA: (code: string) => Promise<LoginSuccessResponse>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  
  // Gestión de Perfil
  refetchUser: () => Promise<void>;
  
  // Gestión 2FA (Configuración de cuenta)
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
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // 🆕 TRUE al inicio
  
  // Estados para el flujo de Login con 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // 1. CARGA INICIAL DE USUARIO
  // ──────────────────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsInitializing(false); // 🆕 Terminamos inicialización
      return;
    }

    try {
      // Usamos UsuarioService para obtener el perfil completo
      const { data } = await UsuarioService.getMe();
      setUser(data);
    } catch (err) {
      console.error("Sesión inválida o expirada", err);
      // Si falla /me, asumimos token inválido y limpiamos
      localStorage.removeItem("auth_token");
      setUser(null);
    } finally {
      setIsInitializing(false); // 🆕 Terminamos inicialización
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Helper para estandarizar errores
  const handleServiceError = (err: unknown, defaultMsg: string) => {
    const error = err as AxiosError<{ error: string }>;
    const msg = error.response?.data?.error || error.message || defaultMsg;
    setError(msg);
    throw err;
  };

  // ──────────────────────────────────────────────────────────
  // 2. LOGIN & LOGOUT
  // ──────────────────────────────────────────────────────────

  const login = async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await AuthService.login(credentials);

      // 🔀 Lógica de Bifurcación
      if ('is2FARequired' in data && data.is2FARequired) {
        // CASO B: Requiere 2FA -> Guardamos estado temporal
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken);
      } else if ('token' in data) {
        // CASO A: Login directo -> Guardamos token y estado
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

      // Éxito: Guardamos token final
      localStorage.setItem("auth_token", data.token);
      
      // Limpiamos estado temporal
      setRequires2FA(false);
      setTwoFaToken(null);
      
      // Cargamos perfil completo
      await loadUser();
      
      return data;
    } catch (err) {
      handleServiceError(err, "Código 2FA incorrecto");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOGOUT MEJORADO - Limpia TODO y refresca la página
  const logout = () => {
    // Intentamos notificar al back, pero limpiamos el front sí o sí
    AuthService.logout().catch(console.error);
    
    // 🧹 LIMPIEZA COMPLETA
    localStorage.clear();
    sessionStorage.clear();
    
    // Resetear el estado de React
    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
    setError(null);
    
    // 🔄 REFRESCAR LA PÁGINA COMPLETAMENTE
    window.location.href = '/login';
  };

  // ──────────────────────────────────────────────────────────
  // 3. REGISTRO
  // ──────────────────────────────────────────────────────────

  const register = async (data: RegisterRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.register(data);
      // No logueamos automáticamente, el usuario debe confirmar email
    } catch (err) {
      handleServiceError(err, "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // 4. GESTIÓN 2FA (PERFIL)
  // ──────────────────────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────────
  // 5. RECUPERACIÓN
  // ──────────────────────────────────────────────────────────

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
        isInitializing, // 🆕 EXPONEMOS EL NUEVO ESTADO
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