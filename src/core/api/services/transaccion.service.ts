import type { ConfirmarTransaccionResponse, CreateTransaccionDto, TransaccionDto, UpdateTransaccionDto } from "@/core/types/transaccion.dto";
import type { AxiosResponse } from "axios";
import httpService from "../httpService";


const BASE_ENDPOINT = '/transacciones';

/**
 * Servicio para la gestión de transacciones de pago.
 * Conecta con el controlador `transaccionController` del backend.
 * 
 * @remarks
 * - Las transacciones representan pagos procesados a través de Mercado Pago
 * - Están asociadas a suscripciones, inversiones, pujas o pagos mensuales
 * - El backend incluye relaciones: proyectoTransaccion, pagoMensual, etc.
 * - Los usuarios solo pueden ver sus propias transacciones
 * - Soft delete: activo: true/false
 */
const TransaccionService = {
 // =================================================
  // 👤 GESTIÓN USUARIO (Mis Transacciones)
  // =================================================

  /**
   * Obtiene el historial completo de transacciones del usuario autenticado.
   * 
   * @returns Lista de transacciones del usuario
   * 
   * @remarks
   * Backend: GET /api/transacciones/mis_transacciones
   * - Requiere autenticación
   * - Retorna transacciones de todas las operaciones del usuario
   * - Incluye relaciones: proyectoTransaccion, pagoMensual, suscripcion, inversion, puja
   * - Ordenadas por fecha (más recientes primero)
   */
  getMyTransactions: async (): Promise<AxiosResponse<TransaccionDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_transacciones`);
  },
/**
   * Obtiene una transacción específica del usuario autenticado.
   * 
   * @param id - ID de la transacción
   * @returns Transacción con detalles completos
   * 
   * @remarks
   * Backend: GET /api/transacciones/mis_transacciones/:id
   * - Requiere autenticación
   * - Solo retorna si la transacción pertenece al usuario
   * - Incluye todas las relaciones y detalles de Mercado Pago

   */
  getMyTransactionById: async (id: number): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_transacciones/${id}`);
  },
/**
   * Actualiza una transacción propia (limitado).
   * 
   * @param id - ID de la transacción
   * @param data - Datos a actualizar
   * @returns Transacción actualizada
   * 
   * @remarks
   * Backend: PUT /api/transacciones/mis_transacciones/:id
   * - Requiere autenticación
   * - Solo permite actualizar campos específicos (no estado de pago)
   * - Útil para agregar notas o comentarios

   */
  updateMyTransaction: async (id: number, data: UpdateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/mis_transacciones/${id}`, data);
  },

  // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todas las transacciones del sistema (solo administradores).
   * 
   * @returns Lista completa de transacciones
   * 
   * @remarks
   * Backend: GET /api/transacciones/
   * - Requiere autenticación y rol admin
   * - Incluye todas las relaciones: proyectoTransaccion, pagoMensual, etc.
   * - Útil para gestión administrativa completa
   * 
   */
  findAll: async (): Promise<AxiosResponse<TransaccionDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },
/**
   * Obtiene una transacción específica por ID (solo administradores).
   * 
   * @param id - ID de la transacción
   * @returns Transacción completa con todas sus relaciones
   * 
   * @remarks
   * Backend: GET /api/transacciones/:id
   * - Requiere autenticación y rol admin
   * - Incluye todos los detalles de Mercado Pago
   */
  findById: async (id: number): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },


  /* Busca una transacción por el ID de la puja asociada */
  getTransaccionByPujaId: async (id_puja: number): Promise<AxiosResponse<{transaccion_id:number}>> => {
    return await httpService.get(`${BASE_ENDPOINT}/por-puja/${id_puja}/transaccion-id`);
  },

  /**
   * Crea una nueva transacción manualmente (solo administradores).
   * 
   * @param data - Datos de la transacción
   * @returns Transacción creada
   * 
   * @remarks
   * Backend: POST /api/transacciones/
   * - Requiere autenticación y rol admin
   * - Útil para transacciones manuales o correcciones
   * - No debe usarse en producción sin validación
   * 
   */
  create: async (data: CreateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },
/**
   * Actualiza una transacción existente (solo administradores).
   * 
   * @param id - ID de la transacción
   * @param data - Datos a actualizar
   * @returns Transacción actualizada
   * 
   * @remarks
   * Backend: PUT /api/transacciones/:id
   * - Requiere autenticación y rol admin
   * - Permite actualizar estado, monto, notas, etc.
   * - Útil para correcciones administrativas

   */
  update: async (id: number, data: UpdateTransaccionDto): Promise<AxiosResponse<TransaccionDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },
 /**
   * Desactiva una transacción (soft delete - solo administradores).
   * 
   * @param id - ID de la transacción a desactivar
   * @returns Void
   * 
   * @remarks
   * Backend: DELETE /api/transacciones/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - La transacción no se elimina físicamente de la BD

   */
  softDelete: async (id: number): Promise<AxiosResponse<void>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

 // =================================================
  // ⚡ ACCIONES CRÍTICAS (ADMIN)
  // =================================================

  /**
   * Fuerza la confirmación de una transacción pendiente (solo administradores).
   * 
   * @param id - ID de la transacción
   * @returns Respuesta con estado de confirmación
   * 
   * @remarks
   * Backend: PUT /api/transacciones/:id/confirmar
   * - Requiere autenticación y rol admin
   * - Útil cuando el webhook de Mercado Pago falló
   * - Consulta el estado actual en Mercado Pago
   * - Actualiza la transacción y la entidad asociada (suscripción, inversión, etc.)
   */
  forceConfirm: async (id: number): Promise<AxiosResponse<ConfirmarTransaccionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/confirmar`);
  }
};

export default TransaccionService;