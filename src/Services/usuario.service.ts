// src/services/usuario.service.ts


import type {
  UsuarioDTO,
  UpdateProfileDTO,
  UpdateUserByAdminDTO,
  CreateUsuarioDTO, // ⬅️ AÑADIDO
  SearchUsuarioParams,
} from '../types/dto/usuario.dto';
import httpService from './httpService';

const ENDPOINT = '/usuarios'; // Ruta base de usuarios

// --- Funciones para el Usuario Logueado (AuthContext) ---

/**
 * VITAL PARA AUTHCONTEXT
 * Obtiene el perfil del usuario actualmente logueado (usando el token)
 * Llama a: GET /api/usuarios/me
 */
export const getMyProfile = (): Promise<UsuarioDTO> => {
  return httpService.get(`${ENDPOINT}/me`);
};

/**
 * Actualiza el perfil del usuario actualmente logueado
 * Llama a: PUT /api/usuarios/me
 */
export const updateMyProfile = (data: UpdateProfileDTO): Promise<UsuarioDTO> => {
  return httpService.put(`${ENDPOINT}/me`, data);
};

/**
 * Realiza un borrado lógico de la propia cuenta del usuario.
 * Llama a: DELETE /api/usuarios/me
 */
export const deleteMyAccount = (): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/me`);
};

// --- Funciones para Administradores ---

/**
 * (Admin) Crea un nuevo usuario.
 * Llama a: POST /api/usuarios
 */
export const createUsuario = (data: CreateUsuarioDTO): Promise<UsuarioDTO> => {
  return httpService.post(ENDPOINT, data);
};

/**
 * (Admin) Obtiene todos los usuarios (incluye inactivos).
 * Llama a: GET /api/usuarios
 */
export const getAllUsuarios = (): Promise<UsuarioDTO[]> => {
  return httpService.get(ENDPOINT);
};

/**
 * (Admin) Obtiene todos los usuarios ACTIVOS.
 * Llama a: GET /api/usuarios/activos
 */
export const getAllActiveUsuarios = (): Promise<UsuarioDTO[]> => {
  return httpService.get(`${ENDPOINT}/activos`);
};

/**
 * (Admin) Obtiene todos los administradores ACTIVOS.
 * Llama a: GET /api/usuarios/admins
 */
export const getAllAdmins = (): Promise<UsuarioDTO[]> => {
  return httpService.get(`${ENDPOINT}/admins`);
};

/**
 * (Admin) Busca usuarios por email o nombre de usuario.
 * Llama a: GET /api/usuarios/search?q=termino
 */
export const searchUsuarios = (params: SearchUsuarioParams): Promise<UsuarioDTO[]> => {
  // ⬅️ CORREGIDO: Tu DTO ahora define 'q', así que esto funciona.
  return httpService.get(`${ENDPOINT}/search`, { params });
};

/**
 * (Admin) Obtiene un usuario específico por ID.
 * Llama a: GET /api/usuarios/:id
 */
export const getUsuarioById = (id: string): Promise<UsuarioDTO> => {
  return httpService.get(`${ENDPOINT}/${id}`); // ⬅️ CORREGIDO: de number a string
};

/**
 * (Admin) Actualiza cualquier campo de un usuario.
 * Llama a: PUT /api/usuarios/:id
 */
export const updateUsuarioByAdmin = (
  id: string, // ⬅️ CORREGIDO: de number a string
  data: UpdateUserByAdminDTO
): Promise<UsuarioDTO> => {
  return httpService.put(`${ENDPOINT}/${id}`, data);
};

/**
 * (Admin) Realiza un soft delete de un usuario.
 * Llama a: DELETE /api/usuarios/:id
 */
export const deleteUsuario = (id: string): Promise<void> => {
  return httpService.delete(`${ENDPOINT}/${id}`); // ⬅️ CORREGIDO: de number a string
};

// --- Función de Confirmación (Pública) ---

/**
 * Llama a: GET /api/usuarios/confirmar/:token
 */
export const confirmEmailByToken = (token: string): Promise<void> => {
  return httpService.get(`${ENDPOINT}/confirmar/${token}`);
};