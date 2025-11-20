// src/services/httpService.ts
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const httpService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request
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

// ✅ Interceptor de Response ACTUALIZADO
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // 🛑 1. MANEJO DE RATE LIMIT (429)
    if (status === 429) {
      console.warn('⏳ Rate Limit Excedido:', data.error);
      return Promise.reject({
        status: 429,
        message: data.error || 'Has excedido el límite de intentos. Espera unos minutos.'
      });
    }

    // 🛑 2. MANEJO DE SESIÓN EXPIRADA (401)
    if (status === 401) {
      if (!window.location.pathname.includes('/login')) {
        console.error('🔒 Sesión expirada');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('two_fa_token');
        window.location.href = '/login';
      }
    }

    // 🛑 3. MANEJO DE BLOQUEOS (403) - AQUÍ ESTÁ EL CAMBIO
    if (status === 403) {
      
      // CASO A: Bloqueos de Seguridad que requieren acción (KYC / 2FA)
      // Tu backend envía: { action_required: 'enable_2fa', ... }
      if (data?.action_required) {
        return Promise.reject({
          status: 403,
          type: 'SECURITY_ACTION', // Etiqueta para que el componente sepa que debe redirigir
          message: data.error,
          action_required: data.action_required,
          kyc_status: data.kyc_status
        });
      }

      // CASO B: Bloqueo por Rol (Admin intentando pagar) 👈 AQUÍ ENTRA TU MIDDLEWARE
      // Tu backend envía: { error: "⛔ Acceso denegado. Los administradores..." }
      // Al no tener 'action_required', cae aquí.
      return Promise.reject({
        status: 403,
        type: 'ROLE_RESTRICTION', // Etiqueta para que el componente solo muestre un Toast de error
        message: data?.error || 'Acceso denegado. No tienes permisos para realizar esta acción.'
      });
    }

    // Error genérico
    return Promise.reject(error);
  }
);

export default httpService;