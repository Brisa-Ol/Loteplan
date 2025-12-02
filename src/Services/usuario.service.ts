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
  
  // =================================================
  // 👤 GESTIÓN DE PERFIL (Usuario Autenticado)
  // =================================================

  /**
   * Obtener perfil del usuario autenticado
   * Backend: router.get("/me", ...)
   */
  getMe: async (): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/me`);
  },

  /**
   * Actualizar perfil propio
   * Backend: router.put("/me", ...)
   */
  updateMe: async (data: UpdateUserMeDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/me`, data);
  },

  /**
   * Darse de baja (Soft Delete propio)
   * Backend: router.delete("/me", ...)
   */
  softDeleteMe: async (): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${ENDPOINT}/me`);
  },

  // =================================================
  // 👮 GESTIÓN DE ADMINISTRADOR (Requiere Rol Admin)
  // =================================================

  /**
   * Obtener todos los usuarios
   * Backend: router.get("/", ...)
   */
  findAll: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(ENDPOINT);
  },

  /**
   * Obtener solo usuarios activos
   * Backend: router.get("/activos", ...)
   */
  findAllActive: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/activos`);
  },

  /**
   * Obtener todos los administradores activos
   * Backend: router.get("/admins", ...)
   */
  findAllAdmins: async (): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/admins`);
  },

  /**
   * Buscar usuarios por nombre o email
   * Backend: router.get("/search", ...) -> usa req.query.q
   */
  search: async (term: string): Promise<AxiosResponse<UsuarioDto[]>> => {
    return await httpService.get(`${ENDPOINT}/search`, {
      params: { q: term }
    });
  },

  /**
   * Crear nuevo usuario (Admin crea usuarios manualmente)
   * Backend: router.post("/", ...)
   */
  create: async (data: CreateUsuarioDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.post(ENDPOINT, data);
  },

  /**
   * Obtener usuario por ID
   * Backend: router.get("/:id", ...)
   */
  findById: async (id: number): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/${id}`);
  },

  /**
   * Actualizar usuario como Admin
   * Backend: router.put("/:id", ...)
   * ⚠️ IMPORTANTE: El backend filtra solo estos campos:
   * - nombre, apellido, email, numero_telefono, activo, rol, nombre_usuario
   */
  updateAdmin: async (id: number, data: UpdateUserAdminDto): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.put(`${ENDPOINT}/${id}`, data);
  },

  /**
   * Soft Delete - Desactivar usuario por ID
   * Backend: router.delete("/:id", ...)
   */
  softDeleteAdmin: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  },

  // =================================================
  // 🔐 SEGURIDAD AVANZADA
  // =================================================

  /**
   * Resetear/Desactivar 2FA de un usuario específico
   * Backend: router.patch("/:id/reset-2fa", ...)
   * ✅ VALIDADO: Usa PATCH correctamente
   */
  adminReset2FA: async (
    userId: number, 
    data: AdminDisable2FADto 
  ): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.patch(`${ENDPOINT}/${userId}/reset-2fa`, data);
  },

  // =================================================
  // 📧 GESTIÓN DE EMAIL Y RECUPERACIÓN
  // =================================================

  /**
   * Confirmar el email del usuario mediante token URL
   * Backend: router.get("/confirmar/:token", ...)
   */
  confirmEmail: async (token: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.get(`${ENDPOINT}/confirmar/${token}`);
  },

  // ⚠️ NOTA: Las siguientes rutas NO EXISTEN en tu backend actual.
  // Si las necesitas, debes crearlas en usuario.routes.js

  /**
   * ⚠️ RUTA NO IMPLEMENTADA EN BACKEND
   * Se asume ruta: POST /usuarios/resend-confirmation
   */
  resendConfirmationEmail: async (email: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${ENDPOINT}/resend-confirmation`, { email });
  },

  /**
   * ⚠️ RUTA NO IMPLEMENTADA EN BACKEND
   * Se asume ruta: POST /usuarios/forgot-password
   */
  forgotPassword: async (email: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${ENDPOINT}/forgot-password`, { email });
  },

  /**
   * ⚠️ RUTA NO IMPLEMENTADA EN BACKEND
   * Se asume ruta: GET /usuarios/reset-password/:token
   */
  validateResetToken: async (token: string): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/reset-password/${token}`);
  },

  /**
   * ⚠️ RUTA NO IMPLEMENTADA EN BACKEND
   * Se asume ruta: GET /usuarios/dni/:dni
   */
  findByDni: async (dni: string): Promise<AxiosResponse<UsuarioDto>> => {
    return await httpService.get(`${ENDPOINT}/dni/${dni}`);
  }

};

export default UsuarioService;