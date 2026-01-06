import type {
  InversionDto,
  CreateInversionDto,
  InversionPorUsuarioDTO,
  LiquidityRateDTO,
  InversionInitResponse,
  ConfirmInversion2faDto
} from '../types/dto/inversion.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { GenericResponseDto } from '../types/dto/auth.dto';

const BASE_ENDPOINT = '/inversiones';

/**
 * Servicio para la gestión de inversiones directas en proyectos.
 * Conecta con el controlador `inversionController` del backend.
 * @remarks
 * - Las inversiones son para proyectos con tipo_inversion: 'directo'
 * - Requiere KYC completado y puede requerir 2FA
 * - Los administradores están bloqueados de realizar inversiones (blockAdminTransactions)
 * - El backend calcula métricas de liquidez y agregación por usuario
 * - Soft delete: activo: true/false
 */
const InversionService = {

  // =================================================
  // 💰 GESTIÓN DE INVERSIONES (USUARIO)
  // =================================================

  /**
   * Crea el registro inicial de una inversión (Paso 1).
   * 
   * @param data - Datos de la inversión (id_proyecto, monto)
   * @returns Respuesta con información de la inversión y estado de pago
   * 
   * @remarks
   * Backend: POST /api/inversiones/
   * - Requiere autenticación
   * - Valida KYC y bloquea administradores (blockAdminTransactions)
   * - Si el usuario tiene 2FA activo, retorna `requires2FA: true`
   * - Crea la inversión en estado 'pendiente'
   * - Solo aplica a proyectos con tipo_inversion: 'directo'
   */
  iniciar: async (data: CreateInversionDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}`, data);
  },

  /**
   * Inicia el flujo de checkout/pago para una inversión existente.
   * 
   * @param inversionId - ID de la inversión
   * @returns Respuesta con URL de checkout o indicador de 2FA requerido
   * 
   * @remarks
   * Backend: POST /api/inversiones/iniciar-pago/:idInversion
   * - Requiere autenticación
   * - Valida KYC y bloquea administradores
   * - Si el usuario tiene 2FA activo, retorna status 202
   * - Genera la preferencia de pago en Mercado Pago

   */
  iniciarPago: async (inversionId: number): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/iniciar-pago/${inversionId}`);
  },

  /**
   * Confirma la inversión con código 2FA y obtiene la URL de checkout.
   * 
   * @param data - Token temporal y código 2FA
   * @returns Respuesta con URL de checkout de Mercado Pago
   * 
   * @remarks
   * Backend: POST /api/inversiones/confirmar-2fa
   * - Requiere autenticación
   * - Se llama solo si `iniciar` o `iniciarPago` retornaron status 202
   * - Valida el código TOTP de 6 dígitos
   * - Genera la preferencia de pago en Mercado Pago
   * - Retorna URL de checkout para redirección

   */
  confirmar2FA: async (data: ConfirmInversion2faDto): Promise<AxiosResponse<InversionInitResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-2fa`, data);
  },

  /**
   * Obtiene todas las inversiones del usuario autenticado.
   * 
   * @returns Lista de inversiones del usuario
   * 
   * @remarks
   * Backend: GET /api/inversiones/mis_inversiones
   * - Requiere autenticación
   * - Retorna inversiones de todos los proyectos
   * - Incluye información del proyecto y estado de pago

   */
  getMisInversiones: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_inversiones`);
  },

  /**
   * Obtiene una inversión específica por ID.
   * 
   * @param id - ID de la inversión
   * @returns Inversión con detalles completos
   * 
   * @remarks
   * Backend: GET /api/inversiones/:id
   * - Requiere autenticación
   * - Solo retorna si la inversión pertenece al usuario o es admin
   * - Incluye: proyecto, transacciones, estado
 
   */
  getById: async (id: number): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todas las inversiones del sistema (solo administradores).
   * 
   * @returns Lista completa de inversiones
   * 
   * @remarks
   * Backend: GET /api/inversiones/
   * - Requiere autenticación y rol admin
   * - Incluye inversiones activas e inactivas
   * - Útil para gestión administrativa completa

   */
  findAll: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene solo las inversiones activas (solo administradores).
   * 
   * @returns Lista de inversiones activas
   * 
   * @remarks
   * Backend: GET /api/inversiones/activas
   * - Requiere autenticación y rol admin
   * - Solo retorna inversiones con activo: true

   */
  findAllActive: async (): Promise<AxiosResponse<InversionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activas`);
  },

  /**
   * Actualiza una inversión existente (solo administradores).
   * 
   * @param id - ID de la inversión a actualizar
   * @param data - Datos parciales a actualizar
   * @returns Inversión actualizada
   * 
   * @remarks
   * Backend: PUT /api/inversiones/:id
   * - Requiere autenticación y rol admin
   * - Actualiza solo los campos proporcionados
   * - Útil para correcciones administrativas

   */
  update: async (id: number, data: Partial<InversionDto>): Promise<AxiosResponse<InversionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Desactiva una inversión (soft delete - solo administradores).
   * 
   * @param id - ID de la inversión a desactivar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/inversiones/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - La inversión no se elimina físicamente de la BD

   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 📊 MÉTRICAS (ADMIN) - KPIs
  // =================================================

  /**
   * Obtiene la tasa de liquidez de inversiones (KPI 6).
   * 
   * @returns Métricas de liquidez
   * 
   * @remarks
   * Backend: GET /api/inversiones/metricas/liquidez
   * - Requiere autenticación y rol admin
   * - Calcula: total_inversiones, inversiones_liquidadas, tasa_liquidez
   * - Útil para dashboard administrativo

   */
  getLiquidityMetrics: async (): Promise<AxiosResponse<{ mensaje: string, data: LiquidityRateDTO }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/liquidez`);
  },

  /**
   * Obtiene inversiones agregadas por usuario (KPI 7).
   * 
   * @returns Lista de usuarios con total de inversiones
   * 
   * @remarks
   * Backend: GET /api/inversiones/metricas/agregado-por-usuario
   * - Requiere autenticación y rol admin
   * - Agrupa inversiones por usuario
   * - Calcula total invertido por usuario
   * - Útil para análisis de inversores
``
   */
  getAggregatedMetrics: async (): Promise<AxiosResponse<{ mensaje: string, data: InversionPorUsuarioDTO[] }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/agregado-por-usuario`);
  }
};

export default InversionService;