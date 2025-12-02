// src/services/loteService.ts
import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateLoteDto, EndAuctionResponse, LoteDto, StartAuctionResponse, UpdateLoteDto } from '../types/dto/lote.dto';

import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/lotes';

const LoteService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================

  /**
   * Obtiene todos los lotes activos (Catálogo principal).
   * Endpoint: GET /lotes/activos
   */
  getAllActive: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },

  /**
   * Obtiene detalle de un lote activo por ID.
   * Endpoint: GET /lotes/:id/activo
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Crea un nuevo lote.
   * Endpoint: POST /lotes
   */
  create: async (data: CreateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Actualiza un lote existente.
   * Endpoint: PUT /lotes/:id
   */
  update: async (id: number, data: UpdateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Soft delete (borrado lógico).
   * Endpoint: DELETE /lotes/:id
   */
  delete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene todos los lotes (incluye inactivos).
   * Endpoint: GET /lotes
   */
  findAllAdmin: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene un lote por ID (vista admin, incluye inactivos).
   * Endpoint: GET /lotes/:id
   */
  findByIdAdmin: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene lotes "huérfanos" (sin proyecto asignado).
   * Útil para el panel de "Asignar Lotes a Proyecto".
   * Endpoint: GET /lotes/sin_proyecto
   */
  getUnassigned: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/sin_proyecto`);
  },

  /**
   * Obtiene todos los lotes de un proyecto específico (Vista Admin).
   * Endpoint: GET /lotes/proyecto/:idProyecto
   */
  getByProject: async (idProyecto: number): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  // =================================================
  // 🔨 CONTROL DE SUBASTA (ADMIN)
  // =================================================

  /**
   * Inicia manualmente la subasta.
   * Dispara notificaciones a suscriptores (si es privada) o a todos los usuarios (si es pública).
   * Endpoint: POST /lotes/:id/start_auction
   */
  startAuction: async (id: number): Promise<AxiosResponse<StartAuctionResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/${id}/start_auction`);
  },

  /**
   * Finaliza manualmente la subasta.
   * Asigna ganador, genera transacción y notifica.
   * Endpoint: PUT /lotes/:id/end
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
    
    // Verificar que tenga fecha de inicio configurada
    if (!lote.fecha_inicio) {
      return { can: false, reason: 'El lote debe tener una fecha de inicio configurada' };
    }
    
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
   * El backend establece un plazo de 90 días desde la finalización.
   */
  calcularDiasRestantesPago(lote: LoteDto): number {
    if (!lote.fecha_fin) return 90;
    
    const fechaFin = new Date(lote.fecha_fin);
    const fechaLimite = new Date(fechaFin.getTime() + 90 * 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const diff = fechaLimite.getTime() - ahora.getTime();
    
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  /**
   * Helper para determinar color de estado según intentos fallidos.
   * 0 intentos = success (verde)
   * 1 intento = warning (amarillo)
   * 2-3 intentos = error (rojo)
   */
  getRiesgoColor(intentos: number): 'success' | 'warning' | 'error' {
    if (intentos === 0) return 'success';
    if (intentos === 1) return 'warning';
    return 'error';
  },

  /**
   * Helper para determinar si un lote es de subasta privada.
   */
  isPrivateAuction(lote: LoteDto): boolean {
    return lote.id_proyecto !== null;
  },

  /**
   * Helper para formatear el precio base.
   */
  formatPrecioBase(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  },

  /**
   * Helper para validar coordenadas antes de enviar al backend.
   */
  validateCoordinates(latitud?: number | null, longitud?: number | null): { 
    valid: boolean; 
    error?: string 
  } {
    // Si ambas son null/undefined, está OK (coordenadas opcionales)
    if ((latitud === null || latitud === undefined) && 
        (longitud === null || longitud === undefined)) {
      return { valid: true };
    }

    // Si una está presente y la otra no, es inválido
    if ((latitud && !longitud) || (!latitud && longitud)) {
      return { 
        valid: false, 
        error: 'Si proporciona latitud, debe proporcionar longitud y viceversa.' 
      };
    }

    // Validar rangos
    if (latitud !== null && latitud !== undefined) {
      if (latitud < -90 || latitud > 90) {
        return { valid: false, error: 'La latitud debe estar entre -90 y 90.' };
      }
    }

    if (longitud !== null && longitud !== undefined) {
      if (longitud < -180 || longitud > 180) {
        return { valid: false, error: 'La longitud debe estar entre -180 y 180.' };
      }
    }

    return { valid: true };
  },

  /**
   * Helper para obtener el texto del estado de subasta.
   */
  getEstadoSubastaText(estado: 'pendiente' | 'activa' | 'finalizada'): string {
    const estados = {
      'pendiente': 'Pendiente',
      'activa': 'Activa',
      'finalizada': 'Finalizada'
    };
    return estados[estado];
  },

  /**
   * Helper para obtener color del badge según estado.
   */
  getEstadoSubastaColor(estado: 'pendiente' | 'activa' | 'finalizada'): 
    'default' | 'primary' | 'success' | 'warning' | 'error' {
    const colores = {
      'pendiente': 'default' as const,
      'activa': 'primary' as const,
      'finalizada': 'success' as const
    };
    return colores[estado];
  }
};

export default LoteService;