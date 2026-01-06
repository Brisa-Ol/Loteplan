import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { ResumenCuentaDto, UpdateResumenCuentaDto } from '../types/dto/resumenCuenta.dto';
import httpService from './httpService';
import type { AxiosResponse } from 'axios';


const BASE_ENDPOINT = '/resumen-cuentas'; 
/**
 * Servicio para la gestión de resúmenes de cuenta.
 * Conecta con el controlador `resumen_cuentaController` del backend.
 * 
 * @remarks
 * - Los resúmenes de cuenta son documentos financieros generados periódicamente
 * - Muestran el estado de pagos, suscripciones e inversiones del usuario
 * - Los usuarios solo pueden ver sus propios resúmenes
 * - Los administradores pueden ver y editar todos los resúmenes
 * - Soft delete: activo: true/false
 */
const ResumenCuentaService = {

 // =================================================
  // 👤 GESTIÓN USUARIO (Mis Resúmenes)
  // =================================================

  /**
   * Obtiene todos los resúmenes de cuenta del usuario autenticado.
   * 
   * @returns Lista de resúmenes del usuario
   * 
   * @remarks
   * Backend: GET /api/resumen-cuentas/mis_resumenes
   * - Requiere autenticación
   * - Retorna solo resúmenes del usuario actual
   * - Incluye información financiera consolidada
   * - Ordenados por fecha (más recientes primero)
   * 
   */
  getMyAccountSummaries: async (): Promise<AxiosResponse<ResumenCuentaDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis_resumenes`);
  },

/**
   * Obtiene un resumen específico por ID (validando propiedad).
   * 
   * @param id - ID del resumen
   * @returns Resumen completo
   * 
   * @remarks
   * Backend: GET /api/resumen-cuentas/:id
   * - Requiere autenticación
   * - Solo retorna si el resumen pertenece al usuario o es admin
   * - Incluye detalles financieros completos

   */
  getById: async (id: number): Promise<AxiosResponse<ResumenCuentaDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },

   // =================================================
  // 👮 GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Obtiene todos los resúmenes de cuenta del sistema (solo administradores).
   * 
   * @returns Lista completa de resúmenes
   * 
   * @remarks
   * Backend: GET /api/resumen-cuentas/
   * - Requiere autenticación y rol admin
   * - Retorna resúmenes de todos los usuarios
   * - Útil para gestión administrativa completa
   */
  findAll: async (): Promise<AxiosResponse<ResumenCuentaDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },

  /**
   * Actualiza manualmente un resumen de cuenta (solo administradores).
   * 
   * @param id - ID del resumen
   * @param data - Datos a actualizar
   * @returns Resumen actualizado
   * 
   * @remarks
   * Backend: PUT /api/resumen-cuentas/:id
   * - Requiere autenticación y rol admin
   * - Útil para correcciones de datos o ajustes manuales
   * - Permite actualizar montos, fechas, estados, etc.

   */
  update: async (id: number, data: UpdateResumenCuentaDto): Promise<AxiosResponse<ResumenCuentaDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },

  /**
 * Desactiva un resumen de cuenta (soft delete - solo administradores).
   * 
   * @param id - ID del resumen a desactivar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/resumen-cuentas/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - El resumen no se elimina físicamente de la BD
   * - Útil para ocultar resúmenes con errores
   * 
   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  }
};

export default ResumenCuentaService;