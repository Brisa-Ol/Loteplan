// src/services/httpService.ts

import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
// ✅ IMPORTANTE: Importamos el puente para mostrar alertas visuales
import { notifyError, notifyWarning } from '../utils/snackbarUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Definición robusta de errores
export interface ApiError {
  status: number;
  message: string;
  type: 'SECURITY_ACTION' | 'ROLE_RESTRICTION' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'UNKNOWN' | 'VALIDATION_ERROR';
  action_required?: 'enable_2fa' | 'complete_kyc';
  kyc_status?: string;
  code?: string;
  originalError?: unknown;
}

const httpService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================================================================
// 📤 REQUEST INTERCEPTOR (Inyección de Token)
// =================================================================
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

// =================================================================
// 📥 RESPONSE INTERCEPTOR (Manejo Global de Errores y Alertas)
// =================================================================
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    // ---------------------------------------------------------------
    // 1. Manejo de "Soft Errors" (Backend devuelve 200 pero success: false)
    // ---------------------------------------------------------------
    const data = response.data;
    
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
        const message = data.error || 'Error en la operación';

        // 🔔 ALERTA VISUAL AUTOMÁTICA
        notifyError(message);

        // Rechazamos la promesa para que el componente sepa que falló
        return Promise.reject({
          status: response.status,
          message: message,
          type: 'VALIDATION_ERROR',
          code: data.code,
          originalError: data
        } as ApiError);
      }
    }
    
    // Si todo está bien, devolvemos la respuesta limpia
    return response;
  },
  (error) => {
    // ---------------------------------------------------------------
    // 2. Manejo de Errores de Red / Servidor (Catch)
    // ---------------------------------------------------------------

    // A) Si no hay respuesta del servidor (Internet caído o Server Down)
    if (!error.response) {
      const msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      
      // 🔔 ALERTA VISUAL
      notifyError(msg); 
      
      return Promise.reject({
        status: 0,
        message: msg,
        type: 'UNKNOWN',
        originalError: error
      } as ApiError);
    }

    const status = error.response.status;
    const data = error.response.data;

    // B) 🛡️ 429: Rate Limit
    if (status === 429) {
      const msg = data.error || 'Has excedido el límite de intentos. Por favor espera unos minutos.';
      
      // 🔔 ALERTA VISUAL
      notifyError(msg); 

      return Promise.reject({
        status: 429,
        message: msg,
        type: 'RATE_LIMIT',
        originalError: error
      } as ApiError);
    }

    // C) 🔒 401: Sesión Expirada
    if (status === 401) {
      // Evitamos bucle infinito si falla el login mismo
      const isLoginEndpoint = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/2fa/verify');
      const msg = data.error || 'Credenciales inválidas o sesión expirada.';
      
      // 🔔 ALERTA VISUAL (Siempre avisamos)
      notifyError(msg);

      if (!isLoginEndpoint && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token');
        // Pequeño delay opcional para que el usuario lea el mensaje antes de cambiar de página
        setTimeout(() => {
             window.location.href = '/login'; 
        }, 1000);
      }
      
      return Promise.reject({
        status: 401,
        message: msg,
        type: 'AUTH_ERROR',
        originalError: error
      } as ApiError);
    }

    // D) 🚫 403: Forbidden (Permisos o Acciones requeridas)
    if (status === 403) {
      // Caso: Requiere acción (KYC o 2FA)
      if (data.action_required) {
        
        // 🔔 ALERTA VISUAL (Usamos Warning para diferenciar)
        notifyWarning(data.error || 'Acción de seguridad requerida');

        return Promise.reject({
          status: 403,
          message: data.error,
          type: 'SECURITY_ACTION',
          action_required: data.action_required,
          kyc_status: data.kyc_status,
          originalError: error
        } as ApiError);
      }
      
      // Caso: Restricción de Rol
      const msg = data.error || 'No tienes permisos para realizar esta acción.';
      
      // 🔔 ALERTA VISUAL
      notifyError(msg);

      return Promise.reject({
        status: 403,
        message: msg,
        type: 'ROLE_RESTRICTION',
        originalError: error
      } as ApiError);
    }

    // E) ⚠️ 400/500: Errores Genéricos (Validación o Crash del Server)
    const errorMessage = data?.success === false 
      ? data.error 
      : (data?.error || data?.message || 'Ocurrió un error inesperado.');
    
    // 🔔 ALERTA VISUAL (Catch-all para cualquier otro error)
    notifyError(errorMessage);

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