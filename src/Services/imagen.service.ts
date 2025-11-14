import type { IImagen } from "../types/dto/imagen.dto";
import apiClient from "./httpService"; // 👈 AJUSTE REALIZADO


const API_URL = "/imagenes";

/**
 * Servicio para la gestión de Imágenes (vistas de usuario).
 * Utiliza httpService para incluir automáticamente el token y manejar errores 401.
 */
class ImagenService {
  [x: string]: any;
  /**
   * Obtiene todas las imágenes activas asociadas a un proyecto.
   * @param idProyecto - ID del proyecto.
   */
  async getImagesByProjectId(idProyecto: number): Promise<IImagen[]> {
    try {
      // Tu httpService (apiClient) ya incluye el interceptor de respuesta,
      // por lo que solo necesitamos devolver data en caso de éxito.
      const response = await apiClient.get<IImagen[]>(
        `${API_URL}/proyecto/${idProyecto}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener imágenes por proyecto:", error);
      // El interceptor de httpService ya maneja el 401 (logout/redirect).
      // Aquí relanzamos el error para que el componente que llama (UI)
      // pueda reaccionar (ej. mostrar un toast de error).
      throw error;
    }
  }

  /**
   * Obtiene todas las imágenes activas asociadas a un lote.
   * @param idLote - ID del lote.
   */
  async getImagesByLoteId(idLote: number): Promise<IImagen[]> {
    try {
      const response = await apiClient.get<IImagen[]>(
        `${API_URL}/lote/${idLote}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener imágenes por lote:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las imágenes activas (sin filtrar por proyecto/lote).
   */
  async getAllActive(): Promise<IImagen[]> {
    try {
      const response = await apiClient.get<IImagen[]>(`${API_URL}/activas`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener imágenes activas:", error);
      throw error;
    }
  }

  /**
   * Obtiene una imagen activa específica por ID.
   * @param id - ID de la imagen.
   */
  async getActiveById(id: number): Promise<IImagen> {
    try {
      const response = await apiClient.get<IImagen>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener imagen activa por ID:", error);
      throw error;
    }
  }
}

export default new ImagenService();