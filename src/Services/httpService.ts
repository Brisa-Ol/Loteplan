// src/services/httpService.ts
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("❌ Error: La variable VITE_API_BASE_URL no está definida en .env");
}

const httpService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request Interceptor - Agrega el token automáticamente
httpService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token'); 
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor - Maneja respuestas y errores
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    // Retorna el objeto completo de Axios para mantener compatibilidad
    // con el patrón { data } = await httpService.post()
    return response;
  },
  (error) => {
    // Manejo de sesión expirada
    if (error.response?.status === 401) {
      console.error('🔒 Sesión expirada o token inválido');
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('two_fa_token');
      
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default httpService;