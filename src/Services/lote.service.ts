import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { CreateLoteDto, EndAuctionResponse, LoteDto, StartAuctionResponse, UpdateLoteDto } from '../types/dto/lote.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';

const BASE_ENDPOINT = '/lotes';
/**
 * Servicio para la gestión de lotes.
 * Conecta con el controlador `loteController` del backend.
 * 
 * @remarks
 * - Los lotes pueden estar asociados a un proyecto o libres
 * - Los lotes pueden tener subastas activas
 * - El backend rastrea intentos_fallidos_pago para calcular riesgo
 * - Soft delete: activo: true/false
 */
const LoteService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================
 /**
   * Obtiene todos los lotes activos disponibles.
   * 
   * @returns Lista de lotes activos
   * 
   * @remarks
   * Backend: GET /api/lotes/activos
   * - Requiere autenticación
   * - Solo retorna lotes con activo: true
   * - Incluye relaciones: proyecto, imagenes
   */
  getAllActive: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },
/**
   * Obtiene un lote activo por su ID.
   * 
   * @param id - ID del lote
   * @returns Lote activo con sus relaciones
   * 
   * @remarks
   * Backend: GET /api/lotes/:id/activo
   * - Requiere autenticación
   * - Solo retorna si el lote está activo
   * - Incluye: proyecto, imagenes, pujas (si aplica)
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },
    /**
   * Obtiene todos los lotes asociados a un proyecto específico.
   * 
   * @param idProyecto - ID del proyecto
   * @returns Lista de lotes del proyecto
   * 
   * @remarks
   * Backend: GET /api/lotes/proyecto/:idProyecto
   * - Requiere autenticación
   * - Retorna solo lotes activos del proyecto
   * - Útil para mostrar lotes en detalle de proyecto
   */
getByProject: async (idProyecto: number): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/proyecto/${idProyecto}`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================
 /**
   * Crea un nuevo lote (solo administradores).
   * 
   * @param data - Datos del lote a crear
   * @returns Lote creado
   * 
   * @remarks
   * Backend: POST /api/lotes/
   * - Requiere autenticación y rol admin
   * - El lote se crea sin proyecto asignado por defecto
   * - Puede asignarse a un proyecto después con ProyectoService.assignLotes
   * 
   */
  create: async (data: CreateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.post(BASE_ENDPOINT, data);
  },
/**
   * Actualiza un lote existente (solo administradores).
   * 
   * @param id - ID del lote a actualizar
   * @param data - Datos parciales a actualizar
   * @returns Lote actualizado
   * 
   * @remarks
   * Backend: PUT /api/lotes/:id
   * - Requiere autenticación y rol admin
   * - Actualiza solo los campos proporcionados
   * - No permite cambiar proyecto (usar ProyectoService.assignLotes)

   */
  update: async (id: number, data: UpdateLoteDto): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },
 /**
   * Desactiva un lote (soft delete - solo administradores).
   * 
   * @param id - ID del lote a desactivar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/lotes/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - El lote no se elimina físicamente de la BD
   * - No se puede pujar en lotes inactivos
   */
  delete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },
/**
   * Obtiene todos los lotes, incluyendo inactivos (solo administradores).
   * 
   * @returns Lista completa de lotes
   * 
   * @remarks
   * Backend: GET /api/lotes/
   * - Requiere autenticación y rol admin
   * - Incluye lotes activos e inactivos
   * - Útil para gestión administrativa completa
   */
  findAllAdmin: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },
/**
   * Obtiene un lote por ID, incluyendo inactivos (solo administradores).
   * 
   * @param id - ID del lote
   * @returns Lote completo con todas sus relaciones
   * 
   * @remarks
   * Backend: GET /api/lotes/:id
   * - Requiere autenticación y rol admin
   * - Retorna incluso si el lote está inactivo
   * - Incluye todas las relaciones: proyecto, imagenes, pujas

   */
  findByIdAdmin: async (id: number): Promise<AxiosResponse<LoteDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },
  /**
   * Obtiene lotes que no tienen proyecto asignado (solo administradores).
   * 
   * @returns Lista de lotes libres (sin proyecto)
   * 
   * @remarks
   * Backend: GET /api/lotes/sin_proyecto
   * - Requiere autenticación y rol admin
   * - Útil para asignar lotes a proyectos nuevos
   * - Solo retorna lotes activos sin proyecto
   * 
   * @throws {ApiError} 403 si no es administrador
   * 
   * @example
   * ```typescript
   * const { data: lotesLibres } = await LoteService.findLotesNoAssociated();
   * // Luego asignar a proyecto: ProyectoService.assignLotes(proyectoId, lotesLibres.map(l => l.id))
   * ```
   */
  findLotesNoAssociated: async (): Promise<AxiosResponse<LoteDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/sin_proyecto`);
  },
// =================================================
  // 🎯 CONTROL DE SUBASTA (ADMIN)
  // =================================================

  /**
   * Inicia una subasta para un lote (solo administradores).
   * 
   * @param id - ID del lote
   * @returns Respuesta con estado de la subasta iniciada
   * 
   * @remarks
   * Backend: POST /api/lotes/:id/start_auction
   * - Requiere autenticación y rol admin
   * - Cambia estado_subasta a 'activa'
   * - Establece fecha_inicio_subasta
   * - Los usuarios pueden comenzar a pujar

   */
  startAuction: async (id: number): Promise<AxiosResponse<StartAuctionResponse>> => {
    return await httpService.post(`${BASE_ENDPOINT}/${id}/start_auction`);
  },
/**
   * Finaliza una subasta y asigna ganador (solo administradores).
   * 
   * @param id - ID del lote
   * @returns Respuesta con información del ganador (si existe)
   * 
   * @remarks
   * Backend: PUT /api/lotes/:id/end
   * - Requiere autenticación y rol admin
   * - Cambia estado_subasta a 'finalizada'
   * - Asigna el ganador (usuario con puja más alta)
   * - Envía notificación al ganador
   * - Si no hay pujas, finaliza sin ganador
   */
  endAuction: async (id: number): Promise<AxiosResponse<EndAuctionResponse>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}/end`);
  },
// =================================================
  // 🛠️ HELPERS VISUALES (No consumen API)
  // =================================================

  /**
   * Calcula el nivel de riesgo de pago de un lote basado en intentos fallidos.
   * 
   * @param lote - Objeto lote con intentos_fallidos_pago
   * @returns Objeto con label y color para mostrar en UI
   * 
   * @remarks
   * - Basado en el campo `intentos_fallidos_pago` del modelo backend
   * - 0 intentos: Normal (verde)
   * - 1 intento: Riesgo Bajo (amarillo)
   * - 2+ intentos: Riesgo Crítico (rojo)
   * - El backend permite máximo 3 intentos antes de bloquear
   */
  calculatePaymentRisk: (lote: LoteDto) => {
    // Basado en tu modelo backend: intentos_fallidos_pago
    const intentos = lote.intentos_fallidos_pago || 0;
    if (intentos === 0) return { label: 'Normal', color: 'success' as const };
    if (intentos === 1) return { label: 'Riesgo Bajo (1/3)', color: 'warning' as const };
    if (intentos >= 2) return { label: 'Riesgo Crítico (2/3)', color: 'error' as const };
    return { label: 'Desconocido', color: 'default' as const };
  }
};

export default LoteService;