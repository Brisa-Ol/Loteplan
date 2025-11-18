// src/services/imagen.service.ts
import httpService from './httpService';
import type { 
  ImagenDTO, 
  CreateImagenDTO, 
  UpdateImagenDTO, 
  CreateImagenResponseDTO 
} from '../types/dto/imagen.dto';

/**
 * Servicio para gestionar imágenes en el sistema
 */
class ImagenService {
  private readonly BASE_PATH = '/api/imagenes';

  /**
   * Obtiene todas las imágenes activas de un proyecto
   * @param idProyecto - ID del proyecto
   * @returns Lista de imágenes activas del proyecto
   */
  async getByProjectId(idProyecto: number): Promise<ImagenDTO[]> {
    const { data } = await httpService.get<ImagenDTO[]>(
      `${this.BASE_PATH}/proyecto/${idProyecto}`
    );
    return data;
  }

  /**
   * Obtiene todas las imágenes activas de un lote
   * @param idLote - ID del lote
   * @returns Lista de imágenes activas del lote
   */
  async getByLoteId(idLote: number): Promise<ImagenDTO[]> {
    const { data } = await httpService.get<ImagenDTO[]>(
      `${this.BASE_PATH}/lote/${idLote}`
    );
    return data;
  }

  /**
   * Obtiene todas las imágenes activas sin proyecto ni lote asignado
   * @returns Lista de imágenes sin asignar
   */
  async getUnassigned(): Promise<ImagenDTO[]> {
    const { data } = await httpService.get<ImagenDTO[]>(
      `${this.BASE_PATH}/unassigned`
    );
    return data;
  }

  /**
   * Obtiene todas las imágenes activas (usuario)
   * @returns Lista de todas las imágenes activas
   */
  async getAllActive(): Promise<ImagenDTO[]> {
    const { data } = await httpService.get<ImagenDTO[]>(
      `${this.BASE_PATH}/activas`
    );
    return data;
  }

  /**
   * Obtiene todas las imágenes (admin - incluye inactivas)
   * @returns Lista de todas las imágenes
   */
  async getAll(): Promise<ImagenDTO[]> {
    const { data } = await httpService.get<ImagenDTO[]>(this.BASE_PATH);
    return data;
  }

  /**
   * Obtiene una imagen por ID (usuario - solo activas)
   * @param id - ID de la imagen
   * @returns Datos de la imagen
   */
  async getById(id: number): Promise<ImagenDTO> {
    const { data } = await httpService.get<ImagenDTO>(
      `${this.BASE_PATH}/${id}`
    );
    return data;
  }

  /**
   * Obtiene una imagen por ID (admin - incluye inactivas)
   * @param id - ID de la imagen
   * @returns Datos de la imagen
   */
  async getByIdAdmin(id: number): Promise<ImagenDTO> {
    const { data } = await httpService.get<ImagenDTO>(
      `${this.BASE_PATH}/admin/${id}`
    );
    return data;
  }

  /**
   * Crea una nueva imagen con archivo
   * @param file - Archivo de imagen
   * @param imagenData - Datos adicionales de la imagen
   * @returns Imagen creada
   */
  async create(
    file: File,
    imagenData: CreateImagenDTO
  ): Promise<CreateImagenResponseDTO> {
    const formData = new FormData();
    formData.append('image', file);

    if (imagenData.descripcion) {
      formData.append('descripcion', imagenData.descripcion);
    }
    if (imagenData.id_proyecto) {
      formData.append('id_proyecto', imagenData.id_proyecto.toString());
    }
    if (imagenData.id_lote) {
      formData.append('id_lote', imagenData.id_lote.toString());
    }

    const { data } = await httpService.post<CreateImagenResponseDTO>(
      this.BASE_PATH,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  }

  /**
   * Actualiza los metadatos de una imagen (no actualiza el archivo)
   * @param id - ID de la imagen
   * @param imagenData - Datos a actualizar
   * @returns Imagen actualizada
   */
  async update(id: number, imagenData: UpdateImagenDTO): Promise<ImagenDTO> {
    const { data } = await httpService.put<ImagenDTO>(
      `${this.BASE_PATH}/${id}`,
      imagenData
    );
    return data;
  }

  /**
   * Elimina lógicamente una imagen (soft delete)
   * @param id - ID de la imagen
   * @returns Mensaje de confirmación
   */
  async softDelete(id: number): Promise<{ message: string }> {
    const { data } = await httpService.delete<{ message: string }>(
      `${this.BASE_PATH}/${id}`
    );
    return data;
  }

  /**
   * Construye la URL completa de una imagen
   * @param imagenUrl - URL relativa de la imagen desde la base de datos
   * @returns URL completa de la imagen
   */
  getImageUrl(imagenUrl: string): string {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    // Si la URL ya es absoluta, retornarla como está
    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
      return imagenUrl;
    }
    
    // Construir la URL completa
    const baseUrl = API_BASE_URL?.endsWith('/') 
      ? API_BASE_URL.slice(0, -1) 
      : API_BASE_URL;
    
    const path = imagenUrl.startsWith('/') 
      ? imagenUrl 
      : `/${imagenUrl}`;
    
    return `${baseUrl}${path}`;
  }
}

const imagenService = new ImagenService();
export { imagenService };