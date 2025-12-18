// src/services/httpService.ts
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ 1. INTERFAZ TIPADA PARA ERRORES
// Esto te permitirá usar "err.type" o "err.action_required" en tus componentes sin TS errors.
export interface ApiError {
  status: number;
  message: string;
  type?: 'SECURITY_ACTION' | 'ROLE_RESTRICTION' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'UNKNOWN';
  action_required?: string; // Ej: 'enable_2fa', 'complete_kyc'
  kyc_status?: string;      // Ej: 'pending', 'rejected'
  originalError?: unknown;  // El error original de Axios por si acaso
}

const httpService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================================================
// 📤 REQUEST INTERCEPTOR (Adjuntar Token)
// =================================================
httpService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =================================================
// 📥 RESPONSE INTERCEPTOR (Manejo de Errores)
// =================================================
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Si no hay respuesta (error de red), devolvemos algo genérico
    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'Error de red. Verifica tu conexión.',
        type: 'UNKNOWN',
        originalError: error
      } as ApiError);
    }

    const status = error.response.status;
    const data = error.response.data;

    // 🛑 1. RATE LIMIT (429)
    if (status === 429) {
      console.warn('⏳ Rate Limit Excedido:', data.error);
      return Promise.reject({
        status: 429,
        message: data.error || 'Has excedido el límite de intentos. Espera unos minutos.',
        type: 'RATE_LIMIT',
        originalError: error
      } as ApiError);
    }

    // 🛑 2. SESIÓN EXPIRADA (401)
    if (status === 401) {
      // Evitamos bucle infinito si ya estamos en login
      if (!window.location.pathname.includes('/login')) {
        console.error('🔒 Sesión expirada');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('two_fa_token');
        window.location.href = '/login';
      }
      return Promise.reject({
        status: 401,
        message: 'Sesión expirada',
        type: 'AUTH_ERROR',
        originalError: error
      } as ApiError);
    }

    // 🛑 3. BLOQUEOS Y PERMISOS (403)
    if (status === 403) {
      
      // CASO A: Requiere Acción de Seguridad (KYC / 2FA)
      // Tu backend envía: { action_required: 'enable_2fa', ... }
      if (data?.action_required) {
        return Promise.reject({
          status: 403,
          message: data.error,
          type: 'SECURITY_ACTION', // 👈 Clave para redirigir
          action_required: data.action_required,
          kyc_status: data.kyc_status,
          originalError: error
        } as ApiError);
      }

      // CASO B: Restricción de Rol (Admin intentando operar)
      // Tu backend envía: { error: "⛔ Acceso denegado..." }
      return Promise.reject({
        status: 403,
        message: data?.error || 'Acceso denegado. No tienes permisos para esta acción.',
        type: 'ROLE_RESTRICTION', // 👈 Clave para mostrar solo alerta
        originalError: error
      } as ApiError);
    }

    // 🛑 4. OTROS ERRORES (400, 404, 500)
    // Devolvemos el mensaje que viene del backend o uno genérico
    return Promise.reject({
      status: status,
      message: data?.message || data?.error || 'Ocurrió un error inesperado.',
      type: 'UNKNOWN',
      originalError: error
    } as ApiError);
  }
);

export default httpService;