// src/services/usuario.service.ts
// (Versión limpia y correcta)

import httpService from './httpService';
import type {
  UsuarioDTO,
  UpdateProfileDTO,
  UpdateUserByAdminDTO,
  CreateUsuarioDTO,
  SearchUsuarioParams,
} from '../types/dto/usuario.dto';
import type { MessageResponse } from '../types/dto/auth.types';

const API_ENDPOINT = '/usuarios';

// ══════════════════════════════════════════════════════════
// SERVICIO DE USUARIOS
// ══════════════════════════════════════════════════════════

const usuarioService = {
  // ──────────────────────────────────────────────────────────
  // RUTAS DE USUARIO AUTENTICADO (/me)
  // ──────────────────────────────────────────────────────────

  /**
   * Obtiene los datos del usuario autenticado
   * Backend: GET /usuarios/me
   */
  async getCurrentUser(): Promise<UsuarioDTO> {
    const { data } = await httpService.get<UsuarioDTO>(`${API_ENDPOINT}/me`);
    return data;
  },

  /**
   * Actualiza el perfil del usuario autenticado
   * Backend: PUT /usuarios/me
   */
  async updateMyProfile(data: UpdateProfileDTO): Promise<UsuarioDTO> {
    const backendData = {
      ...data,
      telefono: data.numero_telefono,
      numero_telefono: undefined,
    };

    const { data: responseData } = await httpService.put<UsuarioDTO>(
      `${API_ENDPOINT}/me`,
      backendData
    );
    return responseData;
  },

  /**
   * Elimina (soft delete) la cuenta del usuario autenticado
   * Backend: DELETE /usuarios/me
   */
  async deleteMyAccount(): Promise<void> {
    await httpService.delete(`${API_ENDPOINT}/me`);
  },

  // ──────────────────────────────────────────────────────────
  // RUTAS DE ADMINISTRACIÓN
  // ──────────────────────────────────────────────────────────

  /**
   * Obtiene todos los usuarios (solo admin)
   * Backend: GET /usuarios
   */
  async getAllUsers(): Promise<UsuarioDTO[]> {
    const { data } = await httpService.get<UsuarioDTO[]>(API_ENDPOINT);
    return data;
  },

  /**
   * Obtiene solo usuarios activos (solo admin)
   * Backend: GET /usuarios/activos
   */
  async getActiveUsers(): Promise<UsuarioDTO[]> {
    const { data } = await httpService.get<UsuarioDTO[]>(
      `${API_ENDPOINT}/activos`
    );
    return data;
  },

  /**
   * Obtiene solo administradores (solo admin)
   * Backend: GET /usuarios/admins
   */
  async getAdmins(): Promise<UsuarioDTO[]> {
    const { data } = await httpService.get<UsuarioDTO[]>(
      `${API_ENDPOINT}/admins`
    );
    return data;
  },

  /**
   * Busca usuarios por nombre de usuario o email (solo admin)
   * Backend: GET /usuarios/search?q=...
   */
  async searchUsers(params: SearchUsuarioParams): Promise<UsuarioDTO[]> {
    const { data } = await httpService.get<UsuarioDTO[]>(
      `${API_ENDPOINT}/search`,
      { params }
    );
    return data;
  },

  /**
   * Obtiene un usuario por ID (solo admin)
   * Backend: GET /usuarios/:id
   */
  async getUserById(id: number): Promise<UsuarioDTO> {
    const { data } = await httpService.get<UsuarioDTO>(
      `${API_ENDPOINT}/${id}`
    );
    return data;
  },

  /**
   * Actualiza un usuario por ID (solo admin)
   * Backend: PUT /usuarios/:id
   */
  async updateUserById(
    id: number,
    data: UpdateUserByAdminDTO
  ): Promise<UsuarioDTO> {
    const backendData = {
      ...data,
      telefono: data.numero_telefono,
      numero_telefono: undefined,
    };

    const { data: responseData } = await httpService.put<UsuarioDTO>(
      `${API_ENDPOINT}/${id}`,
      backendData
    );
    return responseData;
  },

  /**
   * Elimina (soft delete) un usuario por ID (solo admin)
   * Backend: DELETE /usuarios/:id
   */
  async deleteUserById(id: number): Promise<void> {
    await httpService.delete(`${API_ENDPOINT}/${id}`);
  },

  /**
   * Resetea el 2FA de un usuario (solo admin)
   * Backend: PATCH /usuarios/:id/reset-2fa
   */
  async adminReset2FA(id: number): Promise<MessageResponse> {
    const { data } = await httpService.patch<MessageResponse>(
      `${API_ENDPOINT}/${id}/reset-2fa`
    );
    return data;
  },

  /**
   * Crea un nuevo usuario (solo admin)
   * Backend: POST /usuarios
   */
  async createUser(data: CreateUsuarioDTO): Promise<UsuarioDTO> {
    const { data: responseData } = await httpService.post<UsuarioDTO>(
      API_ENDPOINT,
      data
    );
    return responseData;
  },

  /**
   * 🔴 ADMIN: Obtiene estadísticas de nuevos usuarios
   * Backend: GET /usuarios/metricas/nuevos?dias=...
   */
  async getNuevosUsuarios(dias: number = 7): Promise<{ hoy: number; ultimos_dias: number }> {
    const { data } = await httpService.get<{ hoy: number; ultimos_dias: number }>(
      `${API_ENDPOINT}/metricas/nuevos`,
      { params: { dias } }
    );
    return data;
  },
};

export { usuarioService };