// src/Services/imagen.service.ts
import type { CreateImagenDto, ImagenDto, UpdateImagenDto } from '../types/dto/imagen.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/imagenes';

// ✅ 1. CORRECCIÓN: Definir la URL del servidor para los assets estáticos
// Esto apunta a 'http://localhost:3000' (sin el /api)
const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const ImagenService = {

  /**
   * Transforma la ruta relativa de la BD en una URL absoluta funcional.
   * Evita errores 404 al buscar la imagen en el puerto del frontend.
   */
  resolveImageUrl: (path: string | undefined | null): string => {
    if (!path) return '/assets/placeholder-lote.jpg';
    if (path.startsWith('http')) return path;

    // Aseguramos que la ruta comience con slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
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

  /**
   * ✅ 2. CORRECCIÓN: Método Create con manejo de FormData
   * Necesario para enviar archivos binarios al backend (Multer).
   */
  create: async (data: CreateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    const formData = new FormData();
    
    // El backend espera el campo 'image' según tu configuración de Multer
    formData.append('image', data.file); 
    
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    
    // Convertimos números a string para FormData
    if (data.id_lote) formData.append('id_lote', String(data.id_lote));
    if (data.id_proyecto) formData.append('id_proyecto', String(data.id_proyecto));

    return await httpService.post(BASE_ENDPOINT, formData, {
      headers: {
        // Axios detecta FormData y pone el Content-Type: multipart/form-data automáticamente,
        // pero es buena práctica saber que aquí cambia el tipo de contenido.
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  update: async (id: number, data: UpdateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * ✅ 3. CORRECCIÓN: Método Delete faltante
   */
  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default ImagenService;