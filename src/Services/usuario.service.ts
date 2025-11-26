import type { GenericResponseDto } from '../types/dto/auth.dto';
// ✅ Asegúrate de que tu archivo de DTOs exporte todas estas interfaces
import type { 
  UsuarioDto, 
  UpdateProfileDto, 
  UpdateUserAdminDto, 
  CreateUsuarioDto 
} from '../types/dto/usuario.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/usuarios'; 

const UsuarioService = {

  // =================================================
  // 🆕 CREACIÓN (ADMIN)
  // =================================================

  /**
   * Crea un nuevo usuario (Admin).
   * POST /usuarios
   */
  create: async (data: CreateUsuarioDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  // =================================================
  // 👤 GESTIÓN DE PERFIL PROPIO (ME)
  // =================================================

  /**
   * Obtiene los datos del usuario logueado.
   * GET /usuarios/me
   */
  getMe: async (): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/me`);
  },

  /**
   * Actualiza los datos del usuario logueado.
   * PUT /usuarios/me
   */
  updateMe: async (data: UpdateProfileDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/me`, data);
  },

  /**
   * Elimina (soft delete) la cuenta propia.
   * DELETE /usuarios/me
   */
  deleteMe: async (): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/me`);
  },

  // =================================================
  // 👮 GESTIÓN DE USUARIOS (ADMIN)
  // =================================================

  /**
   * Obtiene todos los usuarios (incluidos inactivos).
   * GET /usuarios
   */
  findAll: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene solo usuarios activos.
   * GET /usuarios/activos
   */
  findAllActive: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  /**
   * Obtiene solo administradores activos.
   * GET /usuarios/admins
   */
  findAllAdmins: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/admins`);
  },

  /**
   * Busca usuarios por nombre o email.
   * GET /usuarios/search?q=termino
   */
  search: async (term: string): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/search`, {
      params: { q: term }
    });
  },

  /**
   * Obtiene un usuario específico por ID.
   * GET /usuarios/:id
   */
  findById: async (id: number): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Actualiza un usuario específico (Admin).
   * PUT /usuarios/:id
   */
  updateAdmin: async (id: number, data: UpdateUserAdminDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Borrado lógico de un usuario (Admin).
   * DELETE /usuarios/:id
   */
  softDeleteAdmin: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Resetea el 2FA de un usuario (Acción crítica de Admin).
   * PATCH /usuarios/:id/reset-2fa
   */
  adminReset2FA: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${BASE_ENDPOINT}/${id}/reset-2fa`);
  }
};

export default UsuarioService;