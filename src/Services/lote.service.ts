// src/services/lote.service.ts
// (CORREGIDO: Se cambiaron todos los IDs de 'string' a 'number')

import httpService from './httpService';
import type {
  LoteDTO,
  CreateLoteDTO,
  UpdateLoteDTO,
  StartAuctionDTO,
  EndAuctionResponse,
} from '../types/dto/lote.dto';

const ENDPOINT = '/lotes';

// ══════════════════════════════════════════════════════════
// 📦 CRUD BÁSICO DE LOTES
// ══════════════════════════════════════════════════════════

/**
 * Obtiene todos los lotes (admin only)
 */
export const getAllLotes = async (): Promise<LoteDTO[]> => {
  const { data } = await httpService.get<LoteDTO[]>(ENDPOINT);
  return data;
};

/**
 * Obtiene todos los lotes activos
 */
export const getActiveLotes = async (): Promise<LoteDTO[]> => {
  const { data } = await httpService.get<LoteDTO[]>(`${ENDPOINT}/activos`);
  return data;
};

/**
 * Obtiene un lote por ID (admin)
 */
export const getLoteById = async (id: number): Promise<LoteDTO> => { // ❗ Corregido
  const { data } = await httpService.get<LoteDTO>(`${ENDPOINT}/${id}`);
  return data;
};

/**
 * Obtiene un lote activo por ID
 */
export const getActiveLoteById = async (id: number): Promise<LoteDTO> => { // ❗ Corregido
  const { data } = await httpService.get<LoteDTO>(`${ENDPOINT}/${id}/activo`);
  return data;
};

/**
 * Crea un nuevo lote
 */
export const createLote = async (loteData: CreateLoteDTO): Promise<LoteDTO> => {
  const { data } = await httpService.post<LoteDTO>(ENDPOINT, loteData);
  return data;
};

/**
 * Actualiza un lote
 */
export const updateLote = async (
  id: number, // ❗ Corregido
  loteData: UpdateLoteDTO
): Promise<LoteDTO> => {
  const { data } = await httpService.put<LoteDTO>(`${ENDPOINT}/${id}`, loteData);
  return data;
};

/**
 * Desactiva un lote (soft delete)
 */
export const deleteLote = async (id: number): Promise<void> => { // ❗ Corregido
  await httpService.delete(`${ENDPOINT}/${id}`);
};

// ══════════════════════════════════════════════════════════
// 🔨 GESTIÓN DE PROYECTOS
// ══════════════════════════════════════════════════════════

/**
 * Obtiene lotes sin proyecto asignado
 */
export const getUnassignedLotes = async (): Promise<LoteDTO[]> => {
  const { data } = await httpService.get<LoteDTO[]>(`${ENDPOINT}/sin_proyecto`);
  return data;
};

/**
 * Obtiene lotes de un proyecto específico
 */
export const getLotesByProyecto = async (proyectoId: number): Promise<LoteDTO[]> => { // ❗ Corregido
  const { data } = await httpService.get<LoteDTO[]>(
    `${ENDPOINT}/proyecto/${proyectoId}`
  );
  return data;
};

// ══════════════════════════════════════════════════════════
// 🎯 GESTIÓN DE SUBASTAS
// ══════════════════════════════════════════════════════════

/**
 * Inicia la subasta de un lote
 */
export const startAuction = async (
  id: number, // ❗ Corregido
  data?: StartAuctionDTO
): Promise<{ mensaje: string }> => {
  const { data: response } = await httpService.post<{ mensaje: string }>(
    `${ENDPOINT}/${id}/start_auction`,
    data || {}
  );
  return response;
};

/**
 * Finaliza la subasta de un lote
 */
export const endAuction = async (id: number): Promise<EndAuctionResponse> => { // ❗ Corregido
  const { data } = await httpService.put<EndAuctionResponse>(
    `${ENDPOINT}/${id}/end`
  );
  return data;
};

// ══════════════════════════════════════════════════════════
// EXPORTACIÓN POR DEFECTO
// ══════════════════════════════════════════════════════════

const loteService = {
  getAllLotes,
  getActiveLotes,
  getLoteById,
  getActiveLoteById,
  createLote,
  updateLote,
  deleteLote,
  getUnassignedLotes,
  getLotesByProyecto,
  startAuction,
  endAuction,
};

export default loteService;