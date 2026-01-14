import type { AdminDisable2FADto, CreateUsuarioDto, UpdateUserAdminDto, UpdateUserMeDto, UsuarioDto, ValidateDeactivationResponseDto } from "@/core/types/dto/usuario.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";


const ENDPOINT = '/usuarios';

/**
 * Servicio para la gestión de usuarios (Perfil propio y Administración).
 * Conecta con el controlador `usuarioController` del backend.
 */
const UsuarioService = {

  // ===========================================
  // 1. RUTAS DE ADMINISTRACIÓN (Solo Admins)
  // ===========================================

  /**
   * Crea un nuevo usuario manualmente (sin flujo de registro público).
   * Backend: POST /usuarios/
   */
  create: async (data: CreateUsuarioDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.post(ENDPOINT, data);
  },

  /**
   * Obtiene el listado completo de usuarios (incluyendo inactivos/baneados).
   * Backend: GET /usuarios/
   */
  findAll: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(ENDPOINT);
  },

  /**
   * Obtiene solo los usuarios que están activos en el sistema.
   * Backend: GET /usuarios/activos
   */
  findAllActivos: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/activos`);
  },

  /**
   * Obtiene el listado de administradores activos.
   * Backend: GET /usuarios/admins
   */
  findAllAdmins: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/admins`);
  },

  /**
   * Busca usuarios por nombre de usuario o email (coincidencia parcial).
   * Backend: GET /usuarios/search?q=term
   */
  search: async (term: string): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/search`, {
      params: { q: term }
    });
  },

  // ===========================================
  // 2. RUTAS DE USUARIO PROPIO (Autogestión)
  // ===========================================

  /**
   * Valida el token de confirmación de correo electrónico.
   * Backend: GET /usuarios/confirmar/:token
   */
  confirmEmail: async (token: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.get(`${ENDPOINT}/confirmar/${token}`);
  },

  /**
   * Obtiene el perfil del usuario autenticado actual.
   * Backend: GET /usuarios/me
   */
  getMe: async (): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/me`);
  },

  /**
   * Actualiza los datos permitidos del perfil propio (nombre, email, teléfono).
   * Backend: PUT /usuarios/me
   */
  updateMe: async (data: UpdateUserMeDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/me`, data);
  },

  /**
   * Valida si el usuario puede desactivar su cuenta.
   * Retorna advertencias sobre suscripciones activas, pagos pendientes, etc.
   * Backend: GET /usuarios/me/validate-deactivation
   */
  validateDeactivation: async (): Promise<AxiosResponse<ValidateDeactivationResponseDto>> => {
    return await httpService.get(`${ENDPOINT}/me/validate-deactivation`);
  },

  /**
   * Elimina la cuenta propia (Soft Delete).
   * Requiere código 2FA si el usuario lo tiene activo.
   * Backend: POST /usuarios/me (con body { twofaCode })
   */
  softDeleteMe: async (twofaCode?: string): Promise<AxiosResponse<void>> => {
    const payload = twofaCode ? { twofaCode } : {};
    return await httpService.post(`${ENDPOINT}/me`, payload);
  },

  // ===========================================
  // 3. GESTIÓN POR ID (Admin)
  // ===========================================

  /**
   * Prepara una cuenta desactivada para ser reactivada.
   * Permite actualizar email/nombre_usuario/dni para resolver conflictos.
   * Backend: PATCH /usuarios/:id/prepare-reactivation
   */
  prepareForReactivation: async (
    userId: number,
    data?: { email?: string; nombre_usuario?: string; dni?: string }
  ): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${ENDPOINT}/${userId}/prepare-reactivation`, data || {});
  },

  /**
   * Reactiva una cuenta previamente desactivada.
   * Backend: PATCH /usuarios/:id/reactivate
   */
  reactivateAccount: async (userId: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${ENDPOINT}/${userId}/reactivate`);
  },

  /**
   * Permite a un administrador desactivar el 2FA de otro usuario.
   * Útil cuando el usuario perdió acceso a su dispositivo autenticador.
   * Backend: PATCH /usuarios/:id/reset-2fa
   */
  adminReset2FA: async (
    userId: number,
    data: AdminDisable2FADto
  ): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${ENDPOINT}/${userId}/reset-2fa`, data);
  },

  /**
   * Obtiene el detalle de un usuario específico por su ID.
   * Backend: GET /usuarios/:id
   */
  findById: async (id: number): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/${id}`);
  },

  /**
   * Actualiza los datos de un usuario específico (Admin puede editar más campos, como Rol).
   * Backend: PUT /usuarios/:id
   */
  update: async (id: number, data: UpdateUserAdminDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/${id}`, data);
  },

  /**
   * Desactiva (banea) a un usuario específico.
   * Backend: DELETE /usuarios/:id
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  },

};

export default UsuarioService;