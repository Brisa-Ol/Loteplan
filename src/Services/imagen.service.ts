import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateImagenDto, ImagenDto, UpdateImagenDto } from '../types/dto/imagen.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


// Asumo que la ruta base en tu app.js es /api/imagenes
const BASE_ENDPOINT = '/imagenes';

const ImagenService = {

  // =================================================
  // 🖼️ CREACIÓN (ADMIN) - MULTIPART/FORM-DATA
  // =================================================

  /**
   * Sube una imagen al servidor.
   * Requiere autenticación de Admin.
   */
  create: async (data: CreateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    const formData = new FormData();
    
    // ⚠️ CRÍTICO: El nombre 'image' debe coincidir con uploadImage.single("image") en tu backend
    formData.append('image', data.file); 

    if (data.descripcion) formData.append('descripcion', data.descripcion);
    
    // Validación lógica simple antes de enviar
    if (data.id_proyecto) formData.append('id_proyecto', data.id_proyecto.toString());
    if (data.id_lote) formData.append('id_lote', data.id_lote.toString());

    return await httpService.post(BASE_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // =================================================
  // 🔍 CONSULTAS DE ASOCIACIÓN (USUARIO/PUBLICO)
  // =================================================

  /**
   * Obtiene las imágenes activas de un Proyecto.
   * Ideal para carruseles o galerías de proyecto.
   */
  getByProject: async (idProyecto: number): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  /**
   * Obtiene las imágenes activas de un Lote.
   * Ideal para el detalle del lote.
   */
  getByLote: async (idLote: number): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/lote/${idLote}`);
  },

  /**
   * Obtiene TODAS las imágenes activas del sistema.
   */
  getAllActive: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene imágenes huérfanas (sin proyecto ni lote).
   * Útil para paneles de limpieza o asignación manual.
   */
  getUnassigned: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/unassigned`);
  },

  /**
   * Obtiene TODAS las imágenes (incluso inactivas).
   */
  getAll: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Busca por ID (Ruta Admin que incluye eliminadas).
   */
  getByIdAdmin: async (id: number): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/${id}`);
  },

  /**
   * Actualiza metadatos (descripción, reasignación de proyecto/lote).
   */
  update: async (id: number, data: UpdateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Borrado lógico.
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 🛠️ UTILIDADES PARA EL FRONTEND
  // =================================================

  /**
   * Helper para construir la URL completa de la imagen.
   * Útil si tu backend devuelve rutas relativas como '/uploads/...'
   * y necesitas prefijarlas con la URL base de la API.
   */
  resolveImageUrl: (relativePath: string): string => {
    if (!relativePath) return '/assets/placeholder.png'; // Imagen por defecto
    if (relativePath.startsWith('http')) return relativePath;
    
    // Obtiene la URL base desde tu variable de entorno (ej: http://localhost:3000)
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''; 
    // Asumiendo que VITE_API_BASE_URL incluye '/api', a veces hay que limpiar si las imágenes están en la raíz
    const rootUrl = apiBase.replace('/api', ''); 
    
    return `${rootUrl}${relativePath}`;
  }
};

export default ImagenService;