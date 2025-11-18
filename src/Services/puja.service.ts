// Archivo: src/services/puja.service.ts

// 1. Importamos tu instancia de axios configurada
import httpService from './httpService';

// 2. Importamos todos los DTOs y tipos
import * as DTO from '../types/dto/puja.dto';

// 3. Ruta base del controlador
const API_URL = '/puja';

/**
 * Servicio para gestionar Pujas y el flujo de pago de subastas.
 * Mapea 'puja.controller.js'
 */
export const pujaService = {

  // =============================================
  // RUTAS DE USUARIO (Cliente)
  // =============================================

  /**
   * Crea una nueva puja para un lote.
   * (POST /)
   */
  createPuja: async (data: DTO.PujaCreateDTO): Promise<DTO.IPuja> => {
    const response = await httpService.post<DTO.IPuja>(`${API_URL}/`, data);
    return response.data;
  },

  /**
   * Obtiene todas las pujas "activas".
   * (GET /activas)
   */
  getPujasActivas: async (): Promise<DTO.IPuja[]> => {
    const response = await httpService.get<DTO.IPuja[]>(`${API_URL}/activas`);
    return response.data;
  },

  /**
   * Obtiene todas las pujas del usuario logueado.
   * (GET /mis_pujas)
   */
  getMisPujas: async (): Promise<DTO.IPuja[]> => {
    const response = await httpService.get<DTO.IPuja[]>(`${API_URL}/mis_pujas`);
    return response.data;
  },

  /**
   * Obtiene una puja específica del usuario logueado.
   * (GET /mis_pujas/:id)
   */
  getMiPujaById: async (id: number): Promise<DTO.IPuja> => {
    const response = await httpService.get<DTO.IPuja>(`${API_URL}/mis_pujas/${id}`);
    return response.data;
  },

  /**
   * Elimina (soft delete) una puja del usuario logueado.
   * (DELETE /mis_pujas/:id)
   */
  deleteMiPuja: async (id: number): Promise<void> => {
    // 204 No Content, no devuelve datos
    await httpService.delete(`${API_URL}/mis_pujas/${id}`);
  },

  // --- Flujo de Pago 2FA ---

  /**
   * 1. Inicia el proceso de pago para una puja ganadora.
   * (POST /iniciar-pago/:id)
   */
  iniciarPagoPuja: async (idPuja: number): Promise<DTO.RequestCheckoutResponse> => {
    const response = await httpService.post<DTO.RequestCheckoutResponse>(
      `${API_URL}/iniciar-pago/${idPuja}`
    );
    return response.data;
  },

  /**
   * 2. Confirma el pago con 2FA si fue requerido.
   * (POST /confirmar-2fa)
   */
  confirmarPagoPuja2FA: async (data: DTO.PujaConfirm2FADTO): Promise<DTO.PujaConfirm2FAResponse> => {
    const response = await httpService.post<DTO.PujaConfirm2FAResponse>(
      `${API_URL}/confirmar-2fa`,
      data
    );
    return response.data;
  },

  // =============================================
  // RUTAS DE ADMINISTRADOR
  // =============================================

  /**
   * (Admin) Obtiene TODAS las pujas del sistema.
   * (GET /)
   */
  getAllPujas: async (): Promise<DTO.IPuja[]> => {
    const response = await httpService.get<DTO.IPuja[]>(`${API_URL}/`);
    return response.data;
  },

  /**
   * (Admin) Endpoint para gestionar el fin de una subasta (ej. liberar tokens).
   * (POST /gestionar_finalizacion)
   */
  gestionarFinalizacion: async (data: DTO.PujaManageEndDTO): Promise<DTO.SimpleMessageResponse> => {
    const response = await httpService.post<DTO.SimpleMessageResponse>(
      `${API_URL}/gestionar_finalizacion`,
      data
    );
    return response.data;
  },

  /**
   * (Admin) Obtiene una puja específica por ID.
   * (GET /:id)
   */
  getPujaById: async (id: number): Promise<DTO.IPuja> => {
    const response = await httpService.get<DTO.IPuja>(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * (Admin) Actualiza una puja por ID.
   * (PUT /:id)
   */
  updatePuja: async (id: number, data: DTO.PujaUpdateDTO): Promise<DTO.IPuja> => {
    const response = await httpService.put<DTO.IPuja>(`${API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * (Admin) Elimina (soft delete) una puja por ID.
   * (DELETE /:id)
   */
  deletePuja: async (id: number): Promise<void> => {
    // 204 No Content, no devuelve datos
    await httpService.delete(`${API_URL}/${id}`);
  },
};