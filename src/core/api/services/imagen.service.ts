
import type { CreateImagenDto, ImagenDto, UpdateImagenDto } from '@/core/types/dto/imagen.dto';
import type { AxiosResponse } from 'axios';
import httpService from '../httpService';

const BASE_ENDPOINT = '/imagenes';

/**
 * Obtiene la URL base del servidor backend (sin /api).
 * 
 * @returns URL base del servidor (ej: http://localhost:3000)
 */
const getServerUrl = (): string => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  // Quitamos /api para quedar en la raíz del servidor
  return apiUrl.replace(/\/api$/, '');
};

const SERVER_URL = getServerUrl();

/**
 * Servicio para la gestión de imágenes.
 * Conecta con el controlador `imagenController` del backend.
 * 
 * @remarks
 * - Las imágenes pueden estar asociadas a proyectos o lotes
 * - El backend almacena las imágenes en la carpeta /uploads
 * - Las rutas relativas se resuelven a URLs absolutas
 * - Soft delete: activo: true/false
 * - Helper `resolveImageUrl` convierte rutas relativas a URLs completas
 */
const ImagenService = {

  /**
   * Transforma la ruta relativa de la BD en una URL absoluta funcional.
   * 
   * @param path - Ruta relativa almacenada en la BD (ej: "/uploads/proyectos/1.jpg")
   * @returns URL absoluta completa para mostrar la imagen
   * 
   * @remarks
   * - Si la ruta ya es una URL completa (http/https), la retorna sin cambios
   * - Si la ruta no empieza con '/uploads', la agrega automáticamente
   * - Si la ruta es null/undefined, retorna un placeholder
   * - Construye la URL completa usando SERVER_URL

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
  // 📖 LECTURA (GET) - USUARIO
  // ==========================================

  /**
   * Obtiene todas las imágenes activas de un proyecto específico.
   * 
   * @param idProyecto - ID del proyecto
   * @returns Lista de imágenes del proyecto
   * 
   * @remarks
   * Backend: GET /api/imagenes/proyecto/:idProyecto
   * - Requiere autenticación
   * - Solo retorna imágenes activas
   * - Útil para galería de proyecto
   */
  getAllByProyecto: async (idProyecto: number): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  /**
   * Obtiene todas las imágenes activas de un lote específico.
   * 
   * @param idLote - ID del lote
   * @returns Lista de imágenes del lote
   * 
   * @remarks
   * Backend: GET /api/imagenes/lote/:idLote
   * - Requiere autenticación
   * - Solo retorna imágenes activas
   * - Útil para galería de lote
   */
  getAllByLote: async (idLote: number): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/lote/${idLote}`);
  },

  /**
   * Obtiene todas las imágenes activas del sistema.
   * 
   * @returns Lista de imágenes activas
   * 
   * @remarks
   * Backend: GET /api/imagenes/activas
   * - Requiere autenticación
   * - Solo retorna imágenes con activo: true
   */
  getAllActive: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  /**
   * Obtiene una imagen activa por ID (vista usuario).
   * 
   * @param id - ID de la imagen
   * @returns Imagen activa
   * 
   * @remarks
   * Backend: GET /api/imagenes/:id
   * - Requiere autenticación
   * - Solo retorna si la imagen está activa
   * - Usa findByIdActivo en el backend

   */
  getById: async (id: number): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // ==========================================
  // 👮 ADMIN (Lectura sin filtros)
  // ==========================================

  /**
   * Obtiene todas las imágenes del sistema, incluyendo inactivas (solo administradores).
   * 
   * @returns Lista completa de imágenes
   * 
   * @remarks
   * Backend: GET /api/imagenes/
   * - Requiere autenticación y rol admin
   * - Incluye imágenes activas e inactivas
   * - Útil para gestión administrativa completa

   */
  findAllAdmin: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene una imagen por ID sin filtro de activo (solo administradores).
   * 
   * @param id - ID de la imagen
   * @returns Imagen completa (activa o inactiva)
   * 
   * @remarks
   * Backend: GET /api/imagenes/admin/:id
   * - Requiere autenticación y rol admin
   * - Retorna incluso si la imagen está inactiva
   */
  getByIdAdmin: async (id: number): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admin/${id}`);
  },

  /**
   * Obtiene imágenes activas sin proyecto ni lote asignado (solo administradores).
   * 
   * @returns Lista de imágenes sin asignar
   * 
   * @remarks
   * Backend: GET /api/imagenes/unassigned
   * - Requiere autenticación y rol admin
   * - Útil para asignar imágenes a proyectos/lotes
   * - Solo retorna imágenes activas
   */
  getUnassigned: async (): Promise<AxiosResponse<ImagenDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/unassigned`);
  },

  // ==========================================
  // ✍️ ESCRITURA (POST, PUT, DELETE) - ADMIN
  // ==========================================

  /**
   * Crea una nueva imagen subiendo un archivo (solo administradores).
   * 
   * @param data - Datos de la imagen y archivo
   * @returns Imagen creada
   * 
   * @remarks
   * Backend: POST /api/imagenes/
   * - Requiere autenticación y rol admin
   * - El archivo se envía como 'image' en FormData (Multer)
   * - Puede asociarse a un proyecto o lote opcionalmente
   * - El backend guarda el archivo en /uploads
   */
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

  /**
   * Actualiza una imagen existente (solo administradores).
   * 
   * @param id - ID de la imagen
   * @param data - Datos a actualizar (descripción, asociaciones)
   * @returns Imagen actualizada
   * 
   * @remarks
   * Backend: PUT /api/imagenes/:id
   * - Requiere autenticación y rol admin
   * - Permite actualizar descripción y asociaciones (proyecto/lote)
   * - No permite cambiar el archivo (usar delete + create)
   */
  update: async (id: number, data: UpdateImagenDto): Promise<AxiosResponse<ImagenDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Desactiva una imagen (soft delete - solo administradores).
   * 
   * @param id - ID de la imagen a desactivar
   * @returns Void
   * 
   * @remarks
   * Backend: DELETE /api/imagenes/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - El archivo no se elimina físicamente del servidor
   * - La imagen no se muestra en vistas públicas

   */
  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default ImagenService;