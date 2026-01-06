// src/Services/suscripcion.service.ts
import type { AxiosResponse } from 'axios';
import httpService from './httpService';
import type {
  SuscripcionDto,
  IniciarSuscripcionDto,
  ConfirmarSuscripcion2faDto,
  SuscripcionInitResponse,
  MorosidadDTO,
  CancelacionDTO,
  SuscripcionCanceladaDto
} from '../types/dto/suscripcion.dto';

/**
 * Servicio para la gestión de suscripciones a proyectos.
 * Conecta con los controladores `suscripcionProyectoController` y `suscripcionController` del backend.
 * 
 * @remarks
 * - Las suscripciones activas usan la ruta `/api/suscripciones`
 * - Las suscripciones canceladas usan la ruta `/api/suscripcionesCanceladas`
 * - El backend valida que el usuario tenga KYC completado antes de suscribir
 * - Las suscripciones pueden requerir 2FA si el usuario lo tiene activo
 * - Soft delete: activo: true/false
 */
const BASE_PRINCIPAL = '/suscripciones';

const BASE_HISTORIAL = '/suscripcionesCanceladas'; 

const SuscripcionService = {
 // =================================================
  // 👤 GESTIÓN USUARIO (Operaciones normales)
  // =================================================
  
  /**
   * Inicia el proceso de suscripción a un proyecto.
   * 
   * @param data - Datos de la suscripción (id_proyecto, monto, etc.)
   * @returns Respuesta con información de la suscripción y estado de pago
   * 
   * @remarks
   * Backend: POST /api/suscripciones/iniciar-pago
   * - Requiere autenticación
   * - Valida que el usuario tenga KYC completado
   * - Si el usuario tiene 2FA activo, retorna `requires2FA: true`
   * - Crea la suscripción en estado 'pendiente'
   * - Genera transacción de pago inicial
   *    */
  iniciar: async (data: IniciarSuscripcionDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/iniciar-pago`, data);
  },
 /**
   * Confirma la suscripción con código 2FA (si se requiere).
   * 
   * @param data - Token temporal y código 2FA
   * @returns Respuesta con información de la suscripción confirmada
   * 
   * @remarks
   * Backend: POST /api/suscripciones/confirmar-2fa
   * - Requiere autenticación
   * - Se llama solo si `iniciar` retornó `requires2FA: true`
   * - Valida el código TOTP de 6 dígitos
   * - Confirma la suscripción y procesa el pago inicial

   */
  confirmar2FA: async (data: ConfirmarSuscripcion2faDto): Promise<AxiosResponse<SuscripcionInitResponse>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/confirmar-2fa`, data);
  },
/**
   * Obtiene todas las suscripciones activas del usuario autenticado.
   * 
   * @returns Lista de suscripciones del usuario
   * 
   * @remarks
   * Backend: GET /api/suscripciones/mis_suscripciones
   * - Requiere autenticación
   * - Solo retorna suscripciones activas (activo: true)
   * - Incluye información del proyecto y estado de pagos
   */
  getMisSuscripciones: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/mis_suscripciones`);
  },
/**
   * Obtiene una suscripción específica del usuario autenticado.
   * 
   * @param id - ID de la suscripción
   * @returns Suscripción con detalles completos
   * 
   * @remarks
   * Backend: GET /api/suscripciones/mis_suscripciones/:id
   * - Requiere autenticación
   * - Solo retorna si la suscripción pertenece al usuario
   * - Incluye: proyecto, transacciones, cuotas
   */
  getMiSuscripcionById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },

 /**
   * Cancela una suscripción propia (soft delete).
   * 
   * @param id - ID de la suscripción a cancelar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/suscripciones/mis_suscripciones/:id
   * - Requiere autenticación
   * - Soft delete: establece activo: false
   * - Crea registro en tabla suscripciones_canceladas
   * - No elimina físicamente la suscripción
   */
  cancelar: async (id: number): Promise<AxiosResponse<{ mensaje: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/mis_suscripciones/${id}`);
  },
  /**
   * Confirma un pago mediante webhook de Mercado Pago.
   * 
   * @param transaccionId - ID de la transacción de pago
   * @returns Suscripción actualizada
   * 
   * @remarks
   * Backend: POST /api/suscripciones/confirmar-pago
   * - Requiere autenticación
   * - Se llama cuando Mercado Pago confirma un pago
   * - Actualiza el estado de la transacción y la suscripción
   * - Procesa cuotas pendientes si aplica
   */
  confirmarWebhook: async (transaccionId: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.post(`${BASE_PRINCIPAL}/confirmar-pago`, { transaccionId });
  },

// =================================================
  // 👮 GESTIÓN ADMIN - PRINCIPAL
  // =================================================

  /**
   * Obtiene todas las suscripciones, incluyendo inactivas (solo administradores).
   * 
   * @returns Lista completa de suscripciones
   * 
   * @remarks
   * Backend: GET /api/suscripciones/
   * - Requiere autenticación y rol admin
   * - Incluye suscripciones activas e inactivas
   * - Útil para gestión administrativa completa

   */
  findAll: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(BASE_PRINCIPAL); 
  },

/**
   * Obtiene solo las suscripciones activas (solo administradores).
   * 
   * @returns Lista de suscripciones activas
   * 
   * @remarks
   * Backend: GET /api/suscripciones/activas
   * - Requiere autenticación y rol admin
   * - Solo retorna suscripciones con activo: true

   */
  findAllActivas: async (): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/activas`); 
  },

 /**
   * Obtiene una suscripción específica por ID (solo administradores).
   * 
   * @param id - ID de la suscripción
   * @returns Suscripción completa con todas sus relaciones
   * 
   * @remarks
   * Backend: GET /api/suscripciones/:id
   * - Requiere autenticación y rol admin
   * - Retorna incluso si la suscripción está inactiva
   * - Incluye: proyecto, usuario, transacciones, cuotas
ta: suscripcion } = await SuscripcionService.getById(1);
   * ```
   */
  getById: async (id: number): Promise<AxiosResponse<SuscripcionDto>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/${id}`);
  },

  /**
   * Cancela una suscripción como administrador (soft delete).
   * 
   * @param id - ID de la suscripción a cancelar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/suscripciones/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - Crea registro en tabla suscripciones_canceladas

   */
  cancelarAdmin: async (id: number): Promise<AxiosResponse<{ message: string }>> => {
    return await httpService.delete(`${BASE_PRINCIPAL}/${id}`);
  },

  /**
   * Obtiene todas las suscripciones de un proyecto (activas e inactivas).
   * 
   * @param proyectoId - ID del proyecto
   * @returns Lista de suscripciones del proyecto
   * 
   * @remarks
   * Backend: GET /api/suscripciones/proyecto/:id_proyecto/all
   * - Requiere autenticación y rol admin
   * - Incluye suscripciones activas e inactivas

   */
  getAllByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}/all`);
  },

   /**
   * Obtiene solo las suscripciones activas de un proyecto.
   * 
   * @param proyectoId - ID del proyecto
   * @returns Lista de suscripciones activas del proyecto
   * 
   * @remarks
   * Backend: GET /api/suscripciones/proyecto/:id_proyecto
   * - Requiere autenticación y rol admin
   * - Solo retorna suscripciones activas

   */
  getActiveByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionDto[]>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/proyecto/${proyectoId}`);
  },

// =================================================
  // 📊 MÉTRICAS (ADMIN) - KPIs
  // =================================================

  /**
   * Obtiene métricas de morosidad de suscripciones (KPI).
   * 
   * @returns Métricas de morosidad
   * 
   * @remarks
   * Backend: GET /api/suscripciones/metrics/morosidad
   * - Requiere autenticación y rol admin
   * - Calcula: total_morosos, porcentaje_morosidad, etc.
   * - Útil para dashboard administrativo

  
   */

  getMorosityMetrics: async (): Promise<AxiosResponse<MorosidadDTO>> => {
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/morosidad`);
  },
/**
   * Obtiene métricas de cancelación de suscripciones (KPI).
   * 
   * @returns Métricas de cancelación
   * 
   * @remarks
   * Backend: GET /api/suscripciones/metrics/cancelacion
   * - Requiere autenticación y rol admin
   * - Calcula: total_canceladas, tasa_cancelacion, etc.
   * - Útil para dashboard administrativo

   */
  getCancellationMetrics: async (): Promise<AxiosResponse<CancelacionDTO>> => {
    // Ruta final: /api/suscripciones/metrics/cancelacion
    return await httpService.get(`${BASE_PRINCIPAL}/metrics/cancelacion`);
  },

 // =================================================
  // 🛑 HISTORIAL DE CANCELADAS (TABLA SEPARADA)
  // =================================================

  /**
   * Obtiene todas las suscripciones canceladas (solo administradores).
   * 
   * @returns Lista de suscripciones canceladas
   * 
   * @remarks
   * Backend: GET /api/suscripcionesCanceladas/canceladas
   * - Requiere autenticación y rol admin
   * - Retorna registros de la tabla suscripciones_canceladas
   * - Incluye motivo de cancelación y fecha
   *    */
  getAllCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    // Ruta final: /api/suscripcionesCanceladas/canceladas
    return await httpService.get(`${BASE_HISTORIAL}/canceladas`);
  },
 /**
   * Obtiene las suscripciones canceladas del usuario autenticado.
   * 
   * @returns Lista de suscripciones canceladas del usuario
   * 
   * @remarks
   * Backend: GET /api/suscripcionesCanceladas/mis_canceladas
   * - Requiere autenticación
   * - Solo retorna cancelaciones del usuario actual
   */
  getMisCanceladas: async (): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/mis_canceladas`);
  },
  /**
   * Obtiene las suscripciones canceladas de un proyecto específico.
   * 
   * @param proyectoId - ID del proyecto
   * @returns Lista de suscripciones canceladas del proyecto
   * 
   * @remarks
   * Backend: GET /api/suscripcionesCanceladas/proyecto/canceladas/:idProyecto
   * - Requiere autenticación y rol admin
   * - Útil para análisis de cancelaciones por proyecto

   */
  getCanceladasByProyectoId: async (proyectoId: number): Promise<AxiosResponse<SuscripcionCanceladaDto[]>> => {
    return await httpService.get(`${BASE_HISTORIAL}/proyecto/canceladas/${proyectoId}`);
  }
};

export default SuscripcionService;