// src/services/puja.service.ts
import type { 
  ConfirmarPuja2faDto, 
  CreatePujaDto, 
  ManageAuctionEndDto, 
  ManageAuctionEndResponse,
  PujaCheckoutResponse, 
  PujaDto 
} from '../types/dto/puja.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/pujas';
/**
 * Servicio para la gestión de pujas y subastas.
 * Conecta con el controlador `pujaController` del backend.
 * @remarks
 * - Las pujas están asociadas a lotes en subasta
 * - La primera puja en un lote consume 1 token de subasta
 * - Los administradores están bloqueados de realizar pujas (blockAdminTransactions)
 * - Las pujas ganadoras deben pagarse dentro de 90 días
 * - Soft delete: activo: true/false
 */
const PujaService = {
 // =================================================
  // 🔨 PARTICIPACIÓN EN SUBASTA (USUARIO)
  // =================================================

  /**
   * Realiza una nueva puja en un lote en subasta.
   * 
   * @param data - Datos de la puja (id_lote, monto_puja)
   * @returns Puja creada
   * 
   * @remarks
   * Backend: POST /api/pujas
   * - Requiere autenticación
   * - Bloquea administradores (blockAdminTransactions)
   * - La primera puja en un lote consume 1 token de subasta del usuario
   * - Valida que el monto sea mayor que la puja actual
   * - Valida que el lote esté en subasta activa
   * 
   */
  create: async (data: CreatePujaDto): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
    * Obtiene todas las pujas del usuario autenticado.
   * 
   * @returns Lista de pujas del usuario
   * 
   * @remarks
   * Backend: GET /api/pujas/mis_pujas
   * - Requiere autenticación
   * - Retorna pujas de todos los lotes
   * - Incluye estado actual de cada puja
   * 
   */
  getMyPujas: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas`);
  },

  /**
   * Obtiene el detalle de una puja específica del usuario.
   * 
   * @param id - ID de la puja
   * @returns Puja con detalles completos
   * 
   * @remarks
   * Backend: GET /api/pujas/mis_pujas/:id
   * - Requiere autenticación
   * - Solo retorna si la puja pertenece al usuario
   * - Incluye: lote, estado, fecha_vencimiento_pago
   * 
   */
  getMyPujaById: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  /**
    * Cancela una puja propia (soft delete).
   * 
   * @param id - ID de la puja a cancelar
   * @returns Void
   * 
   * @remarks
   * Backend: DELETE /api/pujas/mis_pujas/:id
   * - Requiere autenticación
   * - Solo permite cancelar si NO es la puja ganadora
   * - Solo permite cancelar si la subasta aún está activa
   * - Soft delete: establece activo: false
   * 
   */
  cancelMyPuja: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  // =================================================
  // 🏆 PAGO DE PUJA GANADORA (USUARIO)
  // =================================================

  /**
   * Inicia el proceso de pago de una puja ganadora.
   * ⚠️ Puede devolver 202 (Accepted) si requiere verificación 2FA.
   * Backend: POST /pujas/iniciar-pago/:id
   * Middleware: authenticate + blockAdminTransactions
   * 
   * Respuestas posibles:
   * - 200: { url_checkout, transaccion_id } (redirección directa)
   * - 202: { is2FARequired: true, pujaId } (requiere 2FA)
   * - 403: Acceso denegado
   * - 409: Estado de puja inválido
   */
  iniciarPagoGanadora: async (idPuja: number): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${idPuja}`);
  },

  /**
   * Confirma el pago con código 2FA y obtiene la URL de pasarela.
   * Backend: POST /pujas/confirmar-2fa
   * Middleware: authenticate + blockAdminTransactions
   * 
   * Respuesta:
   * - 200: { url_checkout, transaccion_id, message }
   * - 401: Código 2FA incorrecto
   * - 403: 2FA no activo o acceso denegado
   */
  confirmarPago2FA: async (data: ConfirmarPuja2faDto): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todas las pujas del sistema (Admin).
   * Backend: GET /pujas
   * Middleware: authenticate + authorizeAdmin
   */
  findAll: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

 /**
   * Gestiona manualmente el cierre de subasta y liberación de tokens (Admin).
   * ⚠️ Generalmente lo hace el backend automáticamente al finalizar subasta.
   * Backend: POST /pujas/gestionar_finalizacion
   * Middleware: authenticate + authorizeAdmin
   */
  manageAuctionEnd: async (data: ManageAuctionEndDto): Promise<AxiosResponse<ManageAuctionEndResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/gestionar_finalizacion`, data);
  },

  /**
   * Obtiene una puja por ID (Admin).
   * Backend: GET /pujas/:id
   * Middleware: authenticate + authorizeAdmin
   */
  findByIdAdmin: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Actualiza una puja (Admin).
   * Backend: PUT /pujas/:id
   * Middleware: authenticate + authorizeAdmin
   */
  updateAdmin: async (id: number, data: Partial<PujaDto>): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Elimina lógicamente una puja (Admin).
   * Backend: DELETE /pujas/:id
   * Middleware: authenticate + authorizeAdmin
   */
  softDeleteAdmin: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

    // =================================================
  // 🔧 HELPERS FRONTEND (Lógica de UI)
  // =================================================

  /**
   * Helper para determinar si una puja puede ser pagada.
   */
  puedePagar(puja: PujaDto): { puede: boolean; razon?: string } {
    if (puja.estado_puja !== 'ganadora_pendiente') {
      return { 
        puede: false, 
        razon: 'Solo pujas ganadoras pendientes pueden pagarse' 
      };
    }

    // Verificar vencimiento (90 días desde finalización)
    if (puja.fecha_vencimiento_pago) {
      const fechaVencimiento = new Date(puja.fecha_vencimiento_pago);
      const ahora = new Date();
      
      if (ahora > fechaVencimiento) {
        return { 
          puede: false, 
          razon: 'El plazo de pago ha expirado' 
        };
      }

      // Calcular días restantes
      const diff = fechaVencimiento.getTime() - ahora.getTime();
      const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (diasRestantes <= 7) {
        return { 
          puede: true, 
          razon: `⚠️ Quedan solo ${diasRestantes} días` 
        };
      }
    }

    return { puede: true };
  },

  /**
   * Helper para obtener el color del badge según estado.
   */
  getEstadoColor(estado: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'activa':
        return 'info';
      case 'ganadora_pendiente':
        return 'warning';
      case 'ganadora_pagada':
        return 'success';
      case 'ganadora_incumplimiento':
        return 'error';
      case 'perdedora':
      case 'cancelada':
        return 'default';
      default:
        return 'default';
    }
  },

  /**
   * Helper para obtener texto legible del estado.
   */
  getEstadoTexto(estado: string): string {
    const textos: Record<string, string> = {
      'activa': 'Activa',
      'ganadora_pendiente': 'Ganadora - Pago Pendiente',
      'ganadora_pagada': 'Ganadora - Pagada',
      'ganadora_incumplimiento': 'Incumplimiento',
      'perdedora': 'Perdedora',
      'cancelada': 'Cancelada',
      'cubierto_por_puja': 'Cubierto'
    };
    return textos[estado] || estado;
  },

  /**
   * Helper para calcular días restantes de pago.
   */
  calcularDiasRestantes(fecha_vencimiento?: string): number {
    if (!fecha_vencimiento) return 90;
    
    const fechaVencimiento = new Date(fecha_vencimiento);
    const ahora = new Date();
    const diff = fechaVencimiento.getTime() - ahora.getTime();
    
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },
getActivePujas: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },
  /**
   * Helper para formatear monto.
   */
  formatMonto(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  }
};

export default PujaService;