// Archivo: src/services/lote.service.ts

// 1. Importamos tu instancia de axios configurada
import httpService from './httpService';

// 2. Importamos todos los DTOs y tipos
import type * as DTO from '../types/dto/lote.dto';

// 3. Ruta base del controlador de lotes
const API_URL = '/lote';

/**
 * Servicio para gestionar Lotes, Subastas y operaciones relacionadas.
 * Mapea 'lote.controller.js'
 */
export const loteService = {

  // =============================================
  // RUTAS DE ADMINISTRADOR (CRUD Básico)
  // =============================================

  /**
   * (Admin) Crea un nuevo lote.
   * (POST /)
   */
  createLote: async (data: DTO.LoteCreateDTO): Promise<DTO.ILote> => {
    const response = await httpService.post<DTO.ILote>(`${API_URL}/`, data);
    return response.data;
  },

  /**
   * (Admin) Obtiene todos los lotes (activos e inactivos).
   * (GET /)
   */
  getAllLotes: async (): Promise<DTO.ILote[]> => {
    const response = await httpService.get<DTO.ILote[]>(`${API_URL}/`);
    return response.data;
  },

  /**
   * (Admin) Obtiene un lote específico por ID.
   * (GET /:id)
   */
  getLoteById: async (id: number): Promise<DTO.ILote> => {
    const response = await httpService.get<DTO.ILote>(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * (Admin) Actualiza un lote por ID.
   * (PUT /:id)
   */
  updateLote: async (id: number, data: DTO.LoteUpdateDTO): Promise<DTO.ILote> => {
    const response = await httpService.put<DTO.ILote>(`${API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * (Admin) Elimina (soft delete) un lote por ID.
   * (DELETE /:id)
   */
  deleteLote: async (id: number): Promise<DTO.SimpleMessageResponse> => {
    const response = await httpService.delete<DTO.SimpleMessageResponse>(`${API_URL}/${id}`);
    return response.data;
  },

  // =============================================
  // RUTAS DE ADMINISTRADOR (Funcionales)
  // =============================================

  /**
   * (Admin) Obtiene lotes que no están asociados a ningún proyecto.
   * (GET /sin_proyecto)
   */
  getLotesSinProyecto: async (): Promise<DTO.ILote[]> => {
    const response = await httpService.get<DTO.ILote[]>(`${API_URL}/sin_proyecto`);
    return response.data;
  },

  /**
   * (Admin) Obtiene todos los lotes asociados a un proyecto específico.
   * (GET /proyecto/:idProyecto)
   */
  getLotesByProyectoId: async (idProyecto: number): Promise<DTO.ILote[]> => {
    const response = await httpService.get<DTO.ILote[]>(
      `${API_URL}/proyecto/${idProyecto}`
    );
    return response.data;
  },

  /**
   * (Admin) Inicia la subasta de un lote.
   * (POST /:id/start_auction)
   */
  startAuction: async (id: number): Promise<DTO.SimpleMessageResponse> => {
    const response = await httpService.post<DTO.SimpleMessageResponse>(
      `${API_URL}/${id}/start_auction`
    );
    return response.data;
  },

  /**
   * (Admin) Finaliza la subasta de un lote.
   * (PUT /:id/end)
   */
  endAuction: async (id: number): Promise<DTO.SimpleMessageResponse> => {
    const response = await httpService.put<DTO.SimpleMessageResponse>(
      `${API_URL}/${id}/end`
    );
    return response.data;
  },

  // =============================================
  // RUTAS PÚBLICAS (Usuario Autenticado)
  // =============================================

  /**
   * (Usuario) Obtiene todos los lotes activos (visibles).
   * (GET /activos)
   */
  getLotesActivos: async (): Promise<DTO.ILote[]> => {
    const response = await httpService.get<DTO.ILote[]>(`${API_URL}/activos`);
    return response.data;
  },

  /**
   * (Usuario) Obtiene un lote activo específico por ID.
   * (GET /:id/activo)
   */
  getLoteActivoById: async (id: number): Promise<DTO.ILote> => {
    const response = await httpService.get<DTO.ILote>(`${API_URL}/${id}/activo`);
    return response.data;
  },
};