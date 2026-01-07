import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { GenericResponseDto } from '../types/dto/auth.dto';
// Asegúrate de tener estos tipos definidos o adáptalos según tus DTOs
import type { 
  CreatePujaDto, 
  PujaDto, 
  ConfirmarPuja2faDto, 
  PujaCheckoutResponse 
} from '../types/dto/puja.dto';

const BASE_ENDPOINT = '/pujas';

/**
 * Servicio para la gestión de Pujas (Subastas).
 * Conecta con `puja.routes.js` del backend.
 */
const PujaService = {

  // =================================================
  // 👤 CLIENTE (USUARIO AHORRISTA)
  // =================================================

  /**
   * Crea una nueva puja en un lote activo.
   * * @param data - { id_lote, monto_puja }
   * @remarks 
   * Backend: POST /api/pujas/
   * - Requiere autenticación.
   * - Consume 1 token de la suscripción del usuario.
   * - Valida que el monto sea mayor al actual y al precio base.
   */
  create: async (data: CreatePujaDto): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Obtiene el historial de pujas del usuario autenticado.
   * * @remarks Backend: GET /api/pujas/mis_pujas
   */
  getMyPujas: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas`);
  },

  /**
   * Obtiene una puja específica del usuario por ID.
   * * @remarks Backend: GET /api/pujas/mis_pujas/:id
   */
  getMyPujaById: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  /**
   * Cancela (Soft Delete) una puja propia.
   * * @remarks Backend: DELETE /api/pujas/mis_pujas/:id
   */
  cancelMyPuja: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  /**
   * Obtiene todas las pujas activas del sistema (público/usuarios).
   * * @remarks Backend: GET /api/pujas/activas
   */
  getAllActive: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  // =================================================
  // 💳 PROCESO DE PAGO (GANADOR DE SUBASTA)
  // =================================================

  /**
   * Inicia el proceso de pago para una puja ganadora pendiente.
   * Genera una transacción pendiente y solicita verificación (puede requerir 2FA).
   * * @param id - ID de la puja ganadora
   * @remarks Backend: POST /api/pujas/iniciar-pago/:id
   */
  initiatePayment: async (id: number): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${id}`);
  },

  /**
   * Confirma el pago de la puja mediante código 2FA.
   * Retorna la URL de Mercado Pago o la confirmación de éxito.
   * * @param data - { codigo, transaccionId }
   * @remarks Backend: POST /api/pujas/confirmar-2fa
   */
  confirmPayment2FA: async (data: ConfirmarPuja2faDto): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todas las pujas del sistema (Histórico completo).
   * * @remarks Backend: GET /api/pujas/ (Admin)
   */
  getAllAdmin: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Ejecuta la lógica de cierre de subasta para un lote.
   * Libera los tokens de los perdedores (excepto Top 3).
   * * @param idLote - ID del lote cuya subasta finalizó
   * @remarks Backend: POST /api/pujas/gestionar_finalizacion
   */
  manageAuctionEnd: async (idLote: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/gestionar_finalizacion`, { id_lote: idLote });
  },

  /**
   * Obtiene una puja por ID (Admin).
   * @remarks Backend: GET /api/pujas/:id
   */
  getByIdAdmin: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Elimina una puja del sistema (Admin).
   * @remarks Backend: DELETE /api/pujas/:id
   */
  deleteAdmin: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default PujaService;