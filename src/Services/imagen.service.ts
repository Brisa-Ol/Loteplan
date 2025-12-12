// src/Services/imagen.service.ts
import type { CreateImagenDto, ImagenDto, UpdateImagenDto } from '../types/dto/imagen.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/imagenes';

// ✅ Obtener la URL base del backend (sin /api)
// Ej: http://localhost:3000
const getServerUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  // Quitamos /api para quedar en la raíz del servidor
  return apiUrl.replace(/\/api$/, ''); 
};

const SERVER_URL = getServerUrl();

const ImagenService = {

  /**
   * ✅ Transforma la ruta relativa de la BD en una URL absoluta funcional.
   * Soluciona el problema de los PDFs agregando '/uploads' si falta.
   */
  resolveImageUrl: (path: string | undefined | null): string => {
    // 1. Validaciones básicas
    if (!path) {
      return '/assets/placeholder-lote.jpg';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('blob:')) {
      return path;
    }

    // 2. Limpieza inicial
    let cleanPath = path.trim();
    
    // Asegurar que empiece con /
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    // 🚨 CORRECCIÓN CRÍTICA PARA EL PDF 🚨
    // Si la ruta NO empieza con '/uploads' y tampoco es un asset estático del front,
    // asumimos que está en la carpeta de uploads del backend.
    // Esto transforma "/plantillas/base/..." en "/uploads/plantillas/base/..."
   if (!cleanPath.startsWith('/uploads') && !cleanPath.startsWith('/assets')) {
    cleanPath = `/uploads${cleanPath}`;
    }

    // 3. Construir URL final
    const fullUrl = `${SERVER_URL}${cleanPath}`;
    
    return fullUrl;
  },

  // ==========================================
  // 📖 LECTURA (GET)
  // ==========================================

  getAllByProyecto: async (idProyecto: number): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  getAllByLote: async (idLote: number): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/lote/${idLote}`);
  },

  getAllActive: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  getById: async (id: number): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // ==========================================
  // ✍️ ESCRITURA (POST, PUT, DELETE)
  // ==========================================

  create: async (data: CreateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    const formData = new FormData();
    formData.append('image', data.file); 
    
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.id_lote) formData.append('id_lote', String(data.id_lote));
    if (data.id_proyecto) formData.append('id_proyecto', String(data.id_proyecto));

    return await httpService.post(BASE_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: async (id: number, data: UpdateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default ImagenService;