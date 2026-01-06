import type { GenericResponseDto } from '../types/dto/auth.dto';
import type {
  ConfirmarPago2faDto,
  CreatePagoManualDto,
  PagoCheckoutResponse,
  PagoDto,
  MonthlyMetricsDto,
  OnTimeMetricsDto,
  GenerateAdvancePaymentsDto,
  UpdatePaymentAmountDto
} from '../types/dto/pago.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/pagos';

/**
 * Servicio para la gestión de pagos y mensualidades.
 * Conecta con el controlador `pagoController` del backend.
 * 
 * @see {@link https://github.com/.../controllers/pago.controller.js} Backend Controller
 * @see {@link https://github.com/.../routes/pago.routes.js} Backend Routes
 * 
 * @remarks
 * - Los pagos están asociados a suscripciones
 * - El backend valida KYC y 2FA antes de procesar pagos
 * - Los administradores están bloqueados de realizar transacciones (blockAdminTransactions)
 * - Los pagos pueden requerir 2FA si el usuario lo tiene activo
 * - Soft delete: activo: true/false
 */
const PagoService = {

  // =================================================
  // 💳 FLUJO DE PAGO (USUARIO)
  // =================================================

  /**
   * Obtiene el historial de pagos del usuario autenticado.
   * 
   * @returns Lista de pagos del usuario
   * 
   * @remarks
   * Backend: GET /api/pagos/mis_pagos
   * - Requiere autenticación
   * - Retorna pagos de todas las suscripciones del usuario
   * - Incluye: estado, monto, fecha_vencimiento, transacciones
   * 
   * @throws {ApiError} 401 si no está autenticado
   * 
   * @example
   * ```typescript
   * const { data: pagos } = await PagoService.getMyPayments();
   * ```
   */
  getMyPayments: async (): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_pagos`);
  },

  /**
   * Inicia el proceso de pago de una mensualidad.
   * 
   * @param idPago - ID del pago a procesar
   * @returns Respuesta con URL de checkout o indicador de 2FA requerido
   * 
   * @remarks
   * Backend: POST /api/pagos/pagar-mes/:id
   * - Requiere autenticación
   * - Valida KYC y bloquea administradores (blockAdminTransactions)
   * - Si el usuario tiene 2FA activo, retorna status 202 con `is2FARequired: true`
   * - Si no requiere 2FA, retorna status 200 con `url_checkout` y `transaccion_id`
   * - Crea la transacción de pago en estado 'pendiente'
   * 
   * @throws {ApiError} 400 si el pago no existe o ya fue procesado
   * @throws {ApiError} 403 si no tiene KYC o es administrador
   * @throws {ApiError} 202 si requiere 2FA (no es error)
   * 
   * @example
   * ```typescript
   * const response = await PagoService.iniciarPagoMensual(1);
   * if (response.status === 202) {
   *   // Mostrar modal de 2FA
   * } else {
   *   // Redirigir a url_checkout
   *   window.location.href = response.data.url_checkout;
   * }
   * ```
   */
  iniciarPagoMensual: async (idPago: number): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/pagar-mes/${idPago}`);
  },

  /**
   * Confirma el pago con código 2FA y obtiene la URL de pasarela de pago.
   * 
   * @param data - Token temporal y código 2FA
   * @returns Respuesta con URL de checkout de Mercado Pago
   * 
   * @remarks
   * Backend: POST /api/pagos/confirmar-pago-2fa
   * - Requiere autenticación
   * - Se llama solo si `iniciarPagoMensual` retornó status 202
   * - Valida el código TOTP de 6 dígitos
   * - Genera la preferencia de pago en Mercado Pago
   * - Retorna URL de checkout para redirección
   * 
   * @throws {ApiError} 400 si el código 2FA es incorrecto
   * @throws {ApiError} 401 si el token temporal expiró
   * @throws {ApiError} 403 si no tiene KYC o es administrador
   * 
   * @example
   * ```typescript
   * await PagoService.confirmarPago2FA({
   *   twoFaToken: tokenTemporal,
   *   token: '123456'
   * });
   * ```
   */
  confirmarPago2FA: async (data: ConfirmarPago2faDto): Promise<AxiosResponse<PagoCheckoutResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/confirmar-pago-2fa`, data);
  },

  // =================================================
  // 📊 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todos los pagos del sistema (solo administradores).
   * 
   * @returns Lista completa de pagos
   * 
   * @remarks
   * Backend: GET /api/pagos/
   * - Requiere autenticación y rol admin
   * - Incluye pagos de todos los usuarios
   * - Útil para gestión administrativa completa
   * 
   * @throws {ApiError} 401 si no está autenticado
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data: todosPagos } = await PagoService.findAll();
   * ```
   */
  findAll: async (): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Obtiene un pago específico por ID (solo administradores).
   * 
   * @param id - ID del pago
   * @returns Pago completo con todas sus relaciones
   * 
   * @remarks
   * Backend: GET /api/pagos/:id
   * - Requiere autenticación y rol admin
   * - Incluye: suscripción, usuario, transacciones
   * 
   * @throws {ApiError} 404 si el pago no existe
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data: pago } = await PagoService.findById(1);
   * ```
   */
  findById: async (id: number): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

  /**
   * Obtiene métricas mensuales de morosidad y recaudo (KPI 1 y 2).
   * 
   * @param mes - Mes (1-12)
   * @param anio - Año (ej: 2024)
   * @returns Métricas de morosidad y recaudo del mes
   * 
   * @remarks
   * Backend: GET /api/pagos/metricas/mensuales?mes=X&anio=Y
   * - Requiere autenticación y rol admin
   * - Calcula: total_recaudado, total_moroso, porcentaje_morosidad
   * - Útil para dashboard administrativo
   * 
   * @throws {ApiError} 400 si mes/anio son inválidos
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data } = await PagoService.getMonthlyMetrics(1, 2024);
   * console.log(`Morosidad: ${data.data.porcentaje_morosidad}%`);
   * ```
   */
  getMonthlyMetrics: async (mes: number, anio: number): Promise<AxiosResponse<{ message: string, data: MonthlyMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/mensuales`, {
      params: { mes, anio }
    });
  },

  /**
   * Obtiene métricas de pagos a tiempo (KPI 3).
   * 
   * @param mes - Mes (1-12)
   * @param anio - Año (ej: 2024)
   * @returns Métricas de pagos a tiempo del mes
   * 
   * @remarks
   * Backend: GET /api/pagos/metricas/a-tiempo?mes=X&anio=Y
   * - Requiere autenticación y rol admin
   * - Calcula: total_pagos, pagos_a_tiempo, tasa_puntualidad
   * - Útil para dashboard administrativo
   * 
   * @throws {ApiError} 400 si mes/anio son inválidos
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data } = await PagoService.getOnTimeMetrics(1, 2024);
   * console.log(`Puntualidad: ${data.data.tasa_puntualidad}%`);
   * ```
   */
  getOnTimeMetrics: async (mes: number, anio: number): Promise<AxiosResponse<{ message: string, data: OnTimeMetricsDto }>> => {
    return await httpService.get(`${BASE_ENDPOINT}/metricas/a-tiempo`, {
      params: { mes, anio }
    });
  },

  /**
   * Genera un pago manual para testing o casos especiales (solo administradores).
   * 
   * @param data - Datos del pago a generar
   * @returns Pago generado
   * 
   * @remarks
   * Backend: POST /api/pagos/trigger-manual-payment
   * - Requiere autenticación y rol admin
   * - Útil para testing o casos excepcionales
   * - No debe usarse en producción sin validación
   * 
   * @throws {ApiError} 400 si los datos son inválidos
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * await PagoService.triggerManualPayment({
   *   id_suscripcion: 1,
   *   monto: 50000
   * });
   * ```
   */
  triggerManualPayment: async (data: CreatePagoManualDto): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.post(`${BASE_ENDPOINT}/trigger-manual-payment`, data);
  },

  /**
   * Actualiza un pago existente (solo administradores).
   * 
   * @param id - ID del pago a actualizar
   * @param data - Datos parciales a actualizar
   * @returns Pago actualizado
   * 
   * @remarks
   * Backend: PUT /api/pagos/:id
   * - Requiere autenticación y rol admin
   * - Actualiza solo los campos proporcionados
   * - Útil para correcciones administrativas
   * 
   * @throws {ApiError} 400 si los datos son inválidos
   * @throws {ApiError} 404 si el pago no existe
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * await PagoService.update(1, { estado: 'pagado' });
   * ```
   */
  update: async (id: number, data: Partial<PagoDto>): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
   * Desactiva un pago (soft delete - solo administradores).
   * 
   * @param id - ID del pago a desactivar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/pagos/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - El pago no se elimina físicamente de la BD
   * 
   * @throws {ApiError} 404 si el pago no existe
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * await PagoService.softDelete(1);
   * ```
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

  // =================================================
  // 🆕 FUNCIONES AVANZADAS (ADMIN)
  // =================================================

  /**
   * Genera múltiples pagos por adelantado para una suscripción.
   * 
   * @param data - Datos de la generación (id_suscripcion, cantidad_meses)
   * @returns Lista de pagos generados
   * 
   * @remarks
   * Backend: POST /api/pagos/generar-adelantados
   * - Requiere autenticación y rol admin
   * - Genera pagos futuros con fechas de vencimiento calculadas
   * - Útil para usuarios que quieren pagar por adelantado
   * 
   * @throws {ApiError} 400 si la suscripción no existe o datos inválidos
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data } = await PagoService.generateAdvancePayments({
   *   id_suscripcion: 1,
   *   cantidad_meses: 6
   * });
   * ```
   */
  generateAdvancePayments: async (data: GenerateAdvancePaymentsDto): Promise<AxiosResponse<{ message: string, pagos: PagoDto[] }>> => {
    return await httpService.post(`${BASE_ENDPOINT}/generar-adelantados`, data);
  },

  /**
   * Obtiene los pagos pendientes de una suscripción específica.
   * 
   * @param idSuscripcion - ID de la suscripción
   * @returns Lista de pagos pendientes
   * 
   * @remarks
   * Backend: GET /api/pagos/pendientes/suscripcion/:id_suscripcion
   * - Requiere autenticación y rol admin
   * - Retorna solo pagos con estado 'pendiente' o 'vencido'
   * - Útil para gestión de morosidad
   * 
   * @throws {ApiError} 404 si la suscripción no existe
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data: pendientes } = await PagoService.getPendingBySubscription(1);
   * ```
   */
  getPendingBySubscription: async (idSuscripcion: number): Promise<AxiosResponse<PagoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/pendientes/suscripcion/${idSuscripcion}`);
  },

  /**
   * Actualiza el monto de un pago pendiente o vencido.
   * 
   * @param idPago - ID del pago
   * @param data - Nuevo monto y razón del cambio
   * @returns Pago actualizado
   * 
   * @remarks
   * Backend: PATCH /api/pagos/:id/monto
   * - Requiere autenticación y rol admin
   * - Solo permite actualizar pagos pendientes o vencidos
   * - Útil para ajustes por inflación o acuerdos especiales
   * 
   * @throws {ApiError} 400 si el pago ya fue pagado o datos inválidos
   * @throws {ApiError} 404 si el pago no existe
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * await PagoService.updatePaymentAmount(1, {
   *   nuevo_monto: 55000,
   *   razon: 'Ajuste por inflación'
   * });
   * ```
   */
  updatePaymentAmount: async (idPago: number, data: UpdatePaymentAmountDto): Promise<AxiosResponse<PagoDto>> => {
    return await httpService.patch(`${BASE_ENDPOINT}/${idPago}/monto`, data);
  }
};

export default PagoService;