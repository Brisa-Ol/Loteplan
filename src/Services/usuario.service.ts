// src/services/usuario.service.ts (Corregido y Alineado con httpService)

import type {
  UsuarioDTO,
  UpdateProfileDTO,
  UpdateUserByAdminDTO,
  CreateUsuarioDTO,
  SearchUsuarioParams,
} from '../types/dto/usuario.dto';
import httpService from './httpService';

const ENDPOINT = '/usuarios';

// ❗ Definimos el tipo de respuesta genérico que usa tu backend
type MessageResponse = {
  message?: string; // Para adminReset2FA
  mensaje?: string; // Para confirmEmailByToken
};

// ══════════════════════════════════════════════════════════
// 🧍 FUNCIONES PARA EL USUARIO LOGUEADO
// ══════════════════════════════════════════════════════════

/**
 * VITAL PARA AUTHCONTEXT
 * Llama a: GET /api/usuarios/me
 */
export const getMyProfile = async (): Promise<UsuarioDTO> => {
  const { data } = await httpService.get<UsuarioDTO>(`${ENDPOINT}/me`);
  return data;
};

export const updateMyProfile = async (data: UpdateProfileDTO): Promise<UsuarioDTO> => {
  const { data: responseData } = await httpService.put<UsuarioDTO>(`${ENDPOINT}/me`, data);
  return responseData;
};

export const deleteMyAccount = async (): Promise<void> => {
  await httpService.delete(`${ENDPOINT}/me`);
};

// ══════════════════════════════════════════════════════════
// 🛡️ FUNCIONES DE ADMINISTRADOR
// ══════════════════════════════════════════════════════════

export const createUsuario = async (data: CreateUsuarioDTO): Promise<UsuarioDTO> => {
  const { data: responseData } = await httpService.post<UsuarioDTO>(ENDPOINT, data);
  return responseData;
};

export const getAllUsuarios = async (): Promise<UsuarioDTO[]> => {
  const { data } = await httpService.get<UsuarioDTO[]>(ENDPOINT);
  return data;
};

export const getAllActiveUsuarios = async (): Promise<UsuarioDTO[]> => {
  const { data } = await httpService.get<UsuarioDTO[]>(`${ENDPOINT}/activos`);
  return data;
};

export const getAllAdmins = async (): Promise<UsuarioDTO[]> => {
  const { data } = await httpService.get<UsuarioDTO[]>(`${ENDPOINT}/admins`);
  return data;
};

export const searchUsuarios = async (params: SearchUsuarioParams): Promise<UsuarioDTO[]> => {
  const { data } = await httpService.get<UsuarioDTO[]>(`${ENDPOINT}/search`, { params });
  return data;
};

export const getUsuarioById = async (id: string): Promise<UsuarioDTO> => {
  const { data } = await httpService.get<UsuarioDTO>(`${ENDPOINT}/${id}`);
  return data;
};

export const updateUsuarioByAdmin = async (
  id: string,
  data: UpdateUserByAdminDTO
): Promise<UsuarioDTO> => {
  const { data: responseData } = await httpService.put<UsuarioDTO>(`${ENDPOINT}/${id}`, data);
  return responseData;
};

export const deleteUsuario = async (id: string): Promise<void> => {
  await httpService.delete(`${ENDPOINT}/${id}`);
};

export const reset2FA = async (id: string): Promise<MessageResponse> => {
  const { data } = await httpService.patch<MessageResponse>(`${ENDPOINT}/${id}/reset-2fa`);
  return data;
};

// ══════════════════════════════════════════════════════════
// ✉️ CONFIRMACIÓN DE EMAIL (PÚBLICA)
// ══════════════════════════════════════════════════════════

export const confirmEmailByToken = async (token: string): Promise<MessageResponse> => {
  const { data } = await httpService.get<MessageResponse>(`${ENDPOINT}/confirmar/${token}`);
  return data;
};