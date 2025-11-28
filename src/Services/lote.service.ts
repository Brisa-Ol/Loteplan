import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/lotes';

// Definimos las respuestas específicas para las acciones de subasta
interface StartAuctionResponse {
  mensaje: string;
  lote?: LoteDto;
}

interface EndAuctionResponse {
  mensaje: string;
  lote?: LoteDto;
  ganador?: {
    id: number;
    nombre: string;
  };
}

const LoteService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================

  /**
   * Obtiene todos los lotes activos (Catálogo principal).
   */
  getAllActive: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  /**
   * Obtiene detalle de un lote activo.
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  create: async (data: CreateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  update: async (id: number, data: UpdateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Soft delete (borrado lógico).
   */
  delete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  findAllAdmin: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  findByIdAdmin: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene lotes "huérfanos" (sin proyecto asignado).
   * Útil para el panel de "Asignar Lotes a Proyecto".
   */
  getUnassigned: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/sin_proyecto`);
  },

  /**
   * Obtiene todos los lotes de un proyecto específico (Vista Admin).
   */
  getByProject: async (idProyecto: number): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  // =================================================
  // 🔨 CONTROL DE SUBASTA (ADMIN)
  // =================================================

  /**
   * Inicia manualmente la subasta.
   * Dispara notificaciones a suscriptores.
   */
  startAuction: async (id: number): Promise<AxiosResponse<StartAuctionResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/${id}/start_auction`);
  },

  /**
   * Finaliza manualmente la subasta.
   * Asigna ganador y genera transacción.
   */
  endAuction: async (id: number): Promise<AxiosResponse<EndAuctionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/end`);
  },

  // =================================================
  // 🔔 UTILIDADES (HELPERS FRONTEND)
  // =================================================

  /**
   * Helper para validar si un lote puede iniciar subasta.
   * Verifica en frontend antes de llamar al backend.
   */
  canStartAuction(lote: LoteDto): { can: boolean; reason?: string } {
    if (lote.estado_subasta !== 'pendiente') {
      return { can: false, reason: 'El lote no está en estado pendiente' };
    }
    // Lotes públicos o privados pueden iniciar
    // Si tiene proyecto, se asume que el backend validó la existencia del mismo al crear
    return { can: true };
  },

  /**
   * Helper para validar si un lote puede finalizarse.
   */
  canEndAuction(lote: LoteDto): { can: boolean; reason?: string } {
    if (lote.estado_subasta !== 'activa') {
      return { can: false, reason: 'Solo se pueden finalizar subastas activas' };
    }
    return { can: true };
  },

  /**
   * Helper para calcular días restantes de pago.
   * Útil para la vista de gestión de cobros.
   */
  calcularDiasRestantesPago(lote: LoteDto): number {
    if (!lote.fecha_fin) return 90; // Default si no hay fecha fin, aunque debería haber si terminó
    
    const fechaFin = new Date(lote.fecha_fin);
    // Plazo de 90 días desde que terminó la subasta
    const fechaLimite = new Date(fechaFin.getTime() + 90 * 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const diff = fechaLimite.getTime() - ahora.getTime();
    
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  /**
   * Helper para determinar color de estado según intentos fallidos.
   */
  getRiesgoColor(intentos: number): 'success' | 'warning' | 'error' {
    if (intentos === 0) return 'success';
    if (intentos === 1) return 'warning';
    return 'error';
  }
};

export default LoteService;