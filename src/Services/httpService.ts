// src/services/httpService.ts

import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Definición robusta de errores para que los componentes sepan qué hacer
export interface ApiError {
  status: number;
  message: string;
  type: 'SECURITY_ACTION' | 'ROLE_RESTRICTION' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'UNKNOWN' | 'VALIDATION_ERROR';
  action_required?: 'enable_2fa' | 'complete_kyc';
  kyc_status?: string;
  originalError?: unknown;
}

const httpService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 📤 Request Interceptor
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

// 📥 Response Interceptor
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    // ✅ MEJORA: Normalizar respuestas del backend
    // El backend puede responder con diferentes formatos:
    // 1. { success: true, data: {...}, message: "..." }
    // 2. { message: "...", data: {...} }
    // 3. Array directo [...]
    // 4. Objeto directo {...}
    
    const data = response.data;
    
    // Si la respuesta tiene el formato estándar del backend con 'success'
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
        // El backend ya marcó esto como error, pero llegó con status 200
        // Convertirlo a un error para que se maneje correctamente
        return Promise.reject({
          status: response.status,
          message: data.error || 'Error en la operación',
          type: 'VALIDATION_ERROR',
          code: data.code,
          originalError: data
        } as ApiError);
      }
      // Si success === true, la respuesta es válida, continuar normalmente
    }
    
    return response;
  },
  (error) => {
    // Si no hay respuesta del servidor (Network Error)
    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
        type: 'UNKNOWN',
        originalError: error
      } as ApiError);
    }

    const status = error.response.status;
    const data = error.response.data;

    // 🛡️ 429: Rate Limit (Demasiados intentos)
    if (status === 429) {
      return Promise.reject({
        status: 429,
        message: data.error || 'Has excedido el límite de intentos. Por favor espera unos minutos.',
        type: 'RATE_LIMIT',
        originalError: error
      } as ApiError);
    }

    // 🔒 401: Sesión Expirada o Credenciales Inválidas
    if (status === 401) {
      // Ignoramos el endpoint de login/verify para no redirigir en caso de credenciales malas
      const isLoginEndpoint = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/2fa/verify');
      
      if (!isLoginEndpoint && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login'; // Redirección de seguridad
      }
      
      return Promise.reject({
        status: 401,
        message: data.error || 'Credenciales inválidas o sesión expirada.',
        type: 'AUTH_ERROR',
        originalError: error
      } as ApiError);
    }

    // 🚫 403: Bloqueos de Seguridad / Roles
    if (status === 403) {
      // Caso A: Requiere acción (KYC o 2FA)
      if (data.action_required) {
        return Promise.reject({
          status: 403,
          message: data.error,
          type: 'SECURITY_ACTION',
          action_required: data.action_required,
          kyc_status: data.kyc_status,
          originalError: error
        } as ApiError);
      }
      
      // Caso B: Restricción de Rol
      return Promise.reject({
        status: 403,
        message: data.error || 'No tienes permisos para realizar esta acción.',
        type: 'ROLE_RESTRICTION',
        originalError: error
      } as ApiError);
    }

    // ⚠️ 400/409/500: Errores de Validación o Servidor
    // ✅ MEJORA: Manejar formato estándar del backend (success: false)
    const errorMessage = data?.success === false 
      ? data.error 
      : (data?.error || data?.message || 'Ocurrió un error inesperado.');
    
    return Promise.reject({
      status: status,
      message: errorMessage,
      type: 'VALIDATION_ERROR',
      code: data?.code,
      originalError: error
    } as ApiError);
  }
);

export default httpService;