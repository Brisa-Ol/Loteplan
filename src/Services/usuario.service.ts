import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type {
  CreateUsuarioDto,
  UpdateUserAdminDto,
  UpdateUserMeDto,
  UsuarioDto,
  AdminDisable2FADto
} from '../types/dto/usuario.dto';
import type { GenericResponseDto } from '../types/dto/auth.dto';

const ENDPOINT = '/usuarios';

const UsuarioService = {
  
  // ===========================================
  // 1. RUTAS DE ADMINISTRACIÓN (Estáticas y Base)
  // ===========================================

  /**
   * Crear nuevo usuario (Admin)
   * Backend Route: POST /
   */
  create: async (data: CreateUsuarioDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.post(ENDPOINT, data);
  },

  /**
   * Obtener todos los usuarios (Admin)
   * Backend Route: GET /
   */
  findAll: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(ENDPOINT);
  },

  /**
   * Obtener solo usuarios activos (Admin)
   * Backend Route: GET /activos
   */
  findAllActivos: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/activos`);
  },

  /**
   * Obtener solo administradores activos (Admin)
   * Backend Route: GET /admins
   */
  findAllAdmins: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/admins`);
  },

  /**
   * Buscar usuarios por query param 'q' (Admin)
   * Backend Route: GET /search?q=...
   */
  search: async (term: string): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/search`, {
      params: { q: term }
    });
  },

  // ===========================================
  // 2. RUTAS DE USUARIO PROPIO Y VERIFICACIÓN
  // ===========================================

  /**
   * Confirmar email con token
   * Backend Route: GET /confirmar/:token
   */
  confirmEmail: async (token: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.get(`${ENDPOINT}/confirmar/${token}`);
  },

  /**
   * Obtener perfil propio
   * Backend Route: GET /me
   */
  getMe: async (): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/me`);
  },

  /**
   * Actualizar perfil propio
   * Backend Route: PUT /me
   */
  updateMe: async (data: UpdateUserMeDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/me`, data);
  },

  /**
   * Eliminar (Soft Delete) cuenta propia
   * Backend Route: DELETE /me
   */
  softDeleteMe: async (): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${ENDPOINT}/me`);
  },

  // ===========================================
  // 3. RUTAS DINÁMICAS (Requieren ID)
  // ===========================================

  /**
   * Resetear 2FA de un usuario (Admin)
   * Backend Route: PATCH /:id/reset-2fa
   */
  adminReset2FA: async (
    userId: number, 
    data: AdminDisable2FADto 
  ): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${ENDPOINT}/${userId}/reset-2fa`, data);
  },

  /**
   * Obtener usuario por ID (Admin)
   * Backend Route: GET /:id
   */
  findById: async (id: number): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/${id}`);
  },

  /**
   * Actualizar usuario por ID (Admin)
   * Backend Route: PUT /:id
   */
  update: async (id: number, data: UpdateUserAdminDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/${id}`, data);
  },

  /**
   * Eliminar (Soft Delete) usuario por ID (Admin)
   * Backend Route: DELETE /:id
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  },

};

export default UsuarioService;