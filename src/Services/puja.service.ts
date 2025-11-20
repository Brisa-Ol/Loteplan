import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { ConfirmarPuja2faDto, CreatePujaDto, ManageAuctionEndDto, PujaCheckoutResponse, PujaDto } from '../types/dto/puja.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/pujas'; // Ajustar según router (/api/pujas?)

const PujaService = {

  // =================================================
  // 🔨 PARTICIPACIÓN EN SUBASTA (USUARIO)
  // =================================================

  /**
   * Realiza una nueva puja.
   * ⚠️ Consume 1 Token de subasta.
   */
  create: async (data: CreatePujaDto): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },

  /**
   * Obtiene "Mis Pujas" (activas e históricas).
   */
  getMyPujas: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas`);
  },

  /**
   * Detalle de una puja propia.
   */
  getMyPujaById: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  /**
   * Cancela (Soft Delete) una puja propia.
   * (Generalmente solo permitido si no es la ganadora, lógica de negocio backend).
   */
  cancelMyPuja: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/mis_pujas/${id}`);
  },

  // =================================================
  // 🏆 PAGO DE PUJA GANADORA (USUARIO)
  // =================================================

  /**
   * Inicia el proceso de pago de una puja ganadora.
   * ⚠️ Puede devolver 202 si requiere 2FA.
   */
  iniciarPagoGanadora: async (idPuja: number): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${idPuja}`);
  },

  /**
   * Confirma el pago con código 2FA y obtiene la URL de pasarela.
   */
  confirmarPago2FA: async (data: ConfirmarPuja2faDto): Promise<AxiosResponse<PujaCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  findAll: async (): Promise<AxiosResponse<PujaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Gestiona manualmente el cierre de subasta y tokens (Admin).
   */
  manageAuctionEnd: async (data: ManageAuctionEndDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/gestionar_finalizacion`, data);
  },

  findByIdAdmin: async (id: number): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  updateAdmin: async (id: number, data: Partial<PujaDto>): Promise<AxiosResponse<PujaDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  softDeleteAdmin: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default PujaService;