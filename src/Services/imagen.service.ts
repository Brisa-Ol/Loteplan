import httpService from './httpService';


import type {
  ImagenDTO,
  CreateImagenDTO,
  UpdateImagenDTO
} from '../types/dto/imagen.dto.ts';

// La ruta base es /api/imagenes
const ENDPOINT = '/imagenes';

/**
 * Obtiene todas las imágenes ACTIVAS de un proyecto.
 * Llama a: GET /api/imagenes/proyecto/:id_proyecto
 * (Tu backend debe tener esta ruta que use 'findByProjectIdActivo').
 */
export const getImagenesByProyectoId = (id_proyecto: number): Promise<ImagenDTO[]> => {
  return httpService.get(`${ENDPOINT}/proyecto/${id_proyecto}`);
};

/**
 * Obtiene todas las imágenes ACTIVAS de un lote.
 * Llama a: GET /api/imagenes/lote/:id_lote
 * (Tu backend debe tener esta ruta que use 'findByLoteIdActivo').
 */
export const getImagenesByLoteId = (id_lote: number): Promise<ImagenDTO[]> => {
  return httpService.get(`${ENDPOINT}/lote/${id_lote}`);
};

/**
 * (Admin) Crea un nuevo registro de imagen (después de subir el archivo).
 * Llama a: POST /api/imagenes
 */
export const createImagen = (data: CreateImagenDTO): Promise<ImagenDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * (Admin) Actualiza la descripción o asociación de una imagen.
 * Llama a: PUT /api/imagenes/:id
 */
export const updateImagen = (id: number, data: UpdateImagenDTO): Promise<ImagenDTO> => {
  return httpService.put(`${ENDPOINT}/${id}`, data);
};

/**
 * (Admin) Realiza un soft delete de una imagen.
 * Llama a: DELETE /api/imagenes/:id
 */
export const deleteImagen = (id: number): Promise<void> => {
  // Tu backend llamará a 'softDelete'
  return httpService.delete(`${ENDPOINT}/${id}`);
};