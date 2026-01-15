// src/core/api/services/imagen.service.ts

import type { CreateImagenDto, ImagenDto, UpdateImagenDto } from '@/core/types/dto/imagen.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';
import { env } from '@/core/config/env'; // ✅ Importamos la configuración centralizada

const BASE_ENDPOINT = '/imagenes';

/**
 * Servicio para la gestión de imágenes.
 */
const ImagenService = {

  /**
   * Transforma la ruta relativa de la BD en una URL absoluta funcional.
   */
  resolveImageUrl: (path: string | undefined | null): string => {
    // 1. Validaciones básicas y Placeholder
    if (!path) {
      return '/assets/placeholder-project.jpg'; // Asegúrate de que esta imagen exista en /public/assets/
    }

    // 2. Normalización de barras (Windows fix: "\" -> "/")
    let cleanPath = path.replace(/\\/g, '/').trim();

    // 3. Si ya es una URL completa o un blob, devolverla
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('blob:')) {
      return cleanPath;
    }

    // 4. Asegurar que empiece con /
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    // 5. Lógica de carpeta Uploads
    // Si la ruta NO empieza con '/uploads' y NO es un asset del front, asumimos que falta el prefijo.
    if (!cleanPath.startsWith('/uploads') && !cleanPath.startsWith('/assets')) {
      cleanPath = `/uploads${cleanPath}`;
    }

    // 6. Construir URL final usando la variable correcta del env.ts
    // env.apiPublicUrl suele ser "http://localhost:3000"
    return `${env.apiPublicUrl}${cleanPath}`;
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
  // 👮 ADMIN
  // ==========================================

  findAllAdmin: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  getByIdAdmin: async (id: number): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/${id}`);
  },

  getUnassigned: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/unassigned`);
  },

  // ==========================================
  // ✍️ ESCRITURA
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