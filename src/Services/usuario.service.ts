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
   * @param data - Datos del usuario.
   */
  create: async (data: CreateUsuarioDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.post(ENDPOINT, data);
  },

  /**
   * Obtiene el listado completo de usuarios (incluyendo inactivos/baneados).
   */
  findAll: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(ENDPOINT);
  },

  /**
   * Obtiene solo los usuarios que están activos en el sistema.
   */
  findAllActivos: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/activos`);
  },

  /**
   * Obtiene el listado de administradores activos.
   */
  findAllAdmins: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/admins`);
  },

  /**
   * Busca usuarios por nombre de usuario o email (coincidencia parcial).
   * @param term - Término de búsqueda (min 3 caracteres).
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
   * @param token - Token recibido por email.
   */
  confirmEmail: async (token: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.get(`${ENDPOINT}/confirmar/${token}`);
  },

  /**
   * Obtiene el perfil del usuario autenticado actual.
   * Usa el token JWT para identificar al usuario.
   */
  getMe: async (): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/me`);
  },

  /**
   * Actualiza los datos permitidos del perfil propio (nombre, email, teléfono).
   */
  updateMe: async (data: UpdateUserMeDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/me`, data);
  },

  /**
   * Elimina la cuenta propia (Soft Delete).
   * Requiere código 2FA si el usuario lo tiene activo.
   * @param twofaCode - Código TOTP de 6 dígitos (Opcional si no tiene 2FA).
   */
  softDeleteMe: async (twofaCode?: string): Promise<AxiosResponse<void>> => {
    const payload = twofaCode ? { twofaCode } : {};
    return await httpService.post(`${ENDPOINT}/me`, payload);
  },

  // ===========================================
  // 3. GESTIÓN POR ID (Admin)
  // ===========================================

  /**
   * Permite a un administrador desactivar el 2FA de otro usuario (en caso de pérdida de dispositivo).
   * @param userId - ID del usuario.
   * @param data - Justificación opcional.
   */
  adminReset2FA: async (
    userId: number, 
    data: AdminDisable2FADto 
  ): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${ENDPOINT}/${userId}/reset-2fa`, data);
  },

  /**
   * Obtiene el detalle de un usuario específico por su ID.
   */
  findById: async (id: number): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/${id}`);
  },

  /**
   * Actualiza los datos de un usuario específico (Admin puede editar más campos, como Rol).
   */
  update: async (id: number, data: UpdateUserAdminDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/${id}`, data);
  },

  /**
   * Desactiva (banea) a un usuario específico.
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  },

};

export default UsuarioService;