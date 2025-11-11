// src/services/lote.service.ts
import httpService from './httpService';
import type { 
  LoteDTO,
  CreateLoteDTO,
  UpdateLoteDTO
} from '../types/dto/lote.dto';

// La ruta base es /api/lotes (según tu index.js)
const ENDPOINT = '/lotes';

// --- Funciones para Usuarios ---

/**
 * Obtiene todos los lotes ACTIVOS (para la lista de subastas).
 * Llama a: GET /api/lotes/activos
 * (Asumiendo una ruta en tu backend que usa 'findAllActivo').
 */
export const getAllActiveLotes = (): Promise<LoteDTO[]> => {
  return httpService.get(`${ENDPOINT}/activos`);
};

/**
 * Obtiene un lote ACTIVO específico por su ID (para ver detalles).
 * Llama a: GET /api/lotes/:id
 * (Asumiendo que tu ruta principal usa 'findByIdActivo').
 */
export const getActiveLoteById = (id: number): Promise<LoteDTO> => {
  return httpService.get(`${ENDPOINT}/${id}`);
};

/**
 * Obtiene los lotes activos de un proyecto específico.
 * Llama a: GET /api/lotes/proyecto/:idProyecto
 * (Tu backend usa 'findLotesByProyectoId').
 */
export const getLotesByProyectoId = (idProyecto: number): Promise<LoteDTO[]> => {
  return httpService.get(`${ENDPOINT}/proyecto/${idProyecto}`);
};

// --- Funciones para Administradores ---

/**
 * (Admin) Crea un nuevo lote.
 * Llama a: POST /api/lotes
 * (Tu backend usa 'create').
 */
export const createLote = (data: CreateLoteDTO): Promise<LoteDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * (Admin) Actualiza un lote.
 * Llama a: PUT /api/lotes/:id
 * (Tu backend usa 'update').
 *
 * ❗ NOTA IMPORTANTE: Si el admin usa esto para cambiar el
 * estado de 'pendiente' a 'activa', tu backend
 * ('loteService.js') se encargará automáticamente de
 * enviar todos los correos y mensajes. El frontend
 * no tiene que hacer nada más.
 */
export const updateLote = (id: number, data: UpdateLoteDTO): Promise<LoteDTO> => {
  return httpService.put(`${ENDPOINT}/${id}`, data);
};

/**
 * (Admin) Realiza un soft delete de un lote.
 * Llama a: DELETE /api/lotes/:id
 * (Tu backend usa 'softDelete').
 */
export const deleteLote = (id: number): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${id}`);
};