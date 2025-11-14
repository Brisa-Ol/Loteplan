import type { IImagen } from "../types/dto/imagen.dto";
import type { IUpdateImagenDTO } from "../types/dto/UpdateImagen.dto";
import apiClient from "./httpService"; 


const API_URL = "/imagenes";

/**
 * Servicio para la gestión de Imágenes (vistas de ADMINISTRADOR).
 * Utiliza httpService para incluir automáticamente el token y manejar errores 401.
 */
class AdminImagenService {
  /**
   * (Admin) Sube una nueva imagen y la asocia.
   */
  async create(
    imageFile: File,
    descripcion: string,
    idProyecto: number | null,
    idLote: number | null
  ): Promise<IImagen> {
    
    const formData = new FormData();
    
    formData.append("image", imageFile);

    if (descripcion) {
      formData.append("descripcion", descripcion);
    }
    if (idProyecto) {
      formData.append("id_proyecto", idProyecto.toString());
    }
    if (idLote) {
      formData.append("id_lote", idLote.toString());
    }

    try {
      // ❗ LA CORRECCIÓN ESTÁ AQUÍ
      const response = await apiClient.post<IImagen>(`${API_URL}/`, formData, {
        headers: {
          // Al setearlo como 'undefined', forzamos a Axios a
          // eliminar el 'Content-Type: application/json' por defecto
          // y permite que el navegador genere el 'multipart/form-data'
          // correcto con su 'boundary'.
          "Content-Type": undefined,
        },
      });
      return response.data;
    } catch (error) {
      // Esta línea es la que ves en la consola (adminImagen.service.ts:55)
      console.error("Error al crear la imagen:", error); 
      throw error;
    }
  }

  /**
   * (Admin) Actualiza los metadatos de una imagen (descripción, asociación).
   */
  async update(id: number, data: IUpdateImagenDTO): Promise<IImagen> {
    try {
      // Esta petición SÍ usa 'application/json' (el default de httpService)
      const response = await apiClient.put<IImagen>(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar la imagen:", error);
      throw error;
    }
  }

  /**
   * (Admin) Realiza un soft-delete de la imagen.
   */
  async softDelete(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `${API_URL}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      throw error;
    }
  }

  /**
   * (Admin) Obtiene TODAS las imágenes (incluyendo inactivas).
   */
  async getAll(): Promise<IImagen[]> {
    try {
      const response = await apiClient.get<IImagen[]>(`${API_URL}/`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener todas las imágenes:", error);
      throw error;
    }
  }

  /**
   * (Admin) Obtiene una imagen por ID (incluyendo inactivas).
   */
  async getById(id: number): Promise<IImagen> {
    try {
      // Ruta /admin/:id
      const response = await apiClient.get<IImagen>(`${API_URL}/admin/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener imagen por ID de admin:", error);
      throw error;
    }
  }

  /**
   * (Admin) Obtiene imágenes activas que no están asignadas a proyecto ni lote.
   */
  async getUnassigned(): Promise<IImagen[]> {
    try {
      const response = await apiClient.get<IImagen[]>(`${API_URL}/unassigned`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener imágenes no asignadas:", error);
      throw error;
    }
  }
}

export default new AdminImagenService();