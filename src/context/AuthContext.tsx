// src/context/AuthContext.tsx

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback
} from "react";
import type { LoginRequestDto, RegisterRequestDto, UserDto } from "../types/dto/auth.dto";
import UsuarioService from "../Services/usuario.service";
import AuthService from "../Services/auth.service";
import Auth2faService from "../Services/auth2fa.service";

// Servicios


interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Estado 2FA durante el Login
  requires2FA: boolean;
  twoFaToken: string | null; // Token temporal
  
  error: string | null;
  
  // Acciones
  login: (credentials: LoginRequestDto) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  
  // Gestión de Perfil
  refetchUser: () => Promise<void>;
  
  // Gestión 2FA (Configuración)
  generate2FASecret: () => Promise<any>; // Ajustar con tu DTO de respuesta QR
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para flujo de Login con 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar usuario al iniciar la app
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Usamos el servicio de Usuario para obtener el perfil completo ('/me')
      const response = await UsuarioService.getMe();
      setUser(response.data);
    } catch (err) {
      console.error("Sesión inválida", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Helper para errores
  const handleServiceError = (err: any, defaultMsg: string) => {
    const msg = err.response?.data?.error || err.message || defaultMsg;
    setError(msg);
    throw err;
  };

  // ==========================================
  // 🔑 LOGIN & LOGOUT
  // ==========================================

  const login = async (credentials: LoginRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(credentials);
      const data = response.data;

      // 🔀 Lógica de Bifurcación (DTO Discriminado)
      if (data.is2FARequired) {
        // CASO B: Requiere 2FA
        setRequires2FA(true);
        setTwoFaToken(data.twoFaToken);
      } else {
        // CASO A: Login directo (data es LoginSuccessResponse)
        localStorage.setItem("auth_token", data.token);
        setUser(data.user);
      }
    } catch (err) {
      handleServiceError(err, "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string) => {
    if (!twoFaToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.verify2fa({
        twoFaToken,
        token: code
      });

      // Éxito: Guardar token final y usuario
      localStorage.setItem("auth_token", response.data.token);
      setUser(response.data.user);
      
      // Limpiar estado temporal
      setRequires2FA(false);
      setTwoFaToken(null);
    } catch (err) {
      handleServiceError(err, "Código incorrecto");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout().catch(() => {}); // Llamada al backend (opcional)
    localStorage.removeItem("auth_token");
    localStorage.removeItem("two_fa_token");
    setUser(null);
    setRequires2FA(false);
    setTwoFaToken(null);
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
  // 🛡️ CONFIGURACIÓN 2FA (PERFIL)
  // ==========================================

  const generate2FASecret = async () => {
    try {
      const res = await Auth2faService.generateSecret();
      return res.data;
    } catch (err) {
      handleServiceError(err, "Error generando secreto");
    }
  };

  const enable2FA = async (code: string) => {
    try {
      await Auth2faService.enable({ token: code });
      await loadUser(); // Refrescar perfil para actualizar 'is_2fa_enabled'
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
  // 📧 RECUPERACIÓN
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