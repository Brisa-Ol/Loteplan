import httpService from './httpService';
import type { AxiosResponse } from 'axios';
import type { GenericResponseDto } from '../types/dto/auth.dto';
import type { 
  AsignarLotesDto, 
  CompletionRateDTO, 
  CreateProyectoDto, 
  MonthlyProgressItem, 
  ProyectoDto, 
  UpdateProyectoDto 
} from '../types/dto/proyecto.dto';

const BASE_ENDPOINT = '/proyectos';
/**
 * Servicio para la gestión de proyectos.
 * Conecta con el controlador `proyectoController` del backend.
 * 
 * @remarks
 * - Las rutas públicas requieren autenticación básica
 * - Las rutas admin requieren rol de administrador
 * - El backend usa soft delete (activo: true/false)
 */
const ProyectoService = {

  // =================================================
  // 👁️ VISTA PÚBLICA / USUARIO
  // =================================================
 /**
   * Obtiene todos los proyectos activos disponibles para usuarios autenticados.
   * 
   * @returns Lista de proyectos activos
   * 
   * @remarks
   * Backend: GET /api/proyectos/activos
   * - Requiere autenticación (authMiddleware.authenticate)
   * - Solo retorna proyectos con activo: true
   * - Incluye relaciones: lotes, imagenes
   * 
   */
  getAllActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos`);
  },
  /**
   * Obtiene proyectos activos filtrados para el perfil Ahorrista (tipo_inversion: 'mensual').
   * 
   * @returns Lista de proyectos mensuales activos
   * 
   * @remarks
   * Backend: GET /api/proyectos/activos/ahorristas
   * - Ruta pública (no requiere autenticación)
   * - Filtra por tipo_inversion: 'mensual'
   * - Solo proyectos activos
   * 
   */
  getAhorristasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos/ahorristas`);
  },

 /**
   * Obtiene proyectos activos filtrados para el perfil Inversionista (tipo_inversion: 'directo').
   * 
   * @returns Lista de proyectos directos activos
   * 
   * @remarks
   * Backend: GET /api/proyectos/activos/inversionistas
   * - Ruta pública (no requiere autenticación)
   * - Filtra por tipo_inversion: 'directo'
   * - Solo proyectos activos
   * 
   * @example
   * ```typescript
   * const { data: proyectosInversionista } = await ProyectoService.getInversionistasActive();
   * ```
   */
  getInversionistasActive: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/activos/inversionistas`);
  },

  /**
   * Obtiene los proyectos en los que el usuario autenticado tiene suscripciones activas.
   * 
   * @returns Lista de proyectos del usuario
   * 
   * @remarks
   * Backend: GET /api/proyectos/mis-proyectos
   * - Requiere autenticación
   * - Retorna proyectos donde el usuario tiene suscripciones activas

   */

  getMyProjects: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(`${BASE_ENDPOINT}/mis-proyectos`);
  },
 /**
   * Obtiene un proyecto activo por su ID (vista pública).
   * 
   * @param id - ID del proyecto
   * @returns Proyecto activo con sus relaciones
   * 
   * @remarks
   * Backend: GET /api/proyectos/:id/activo
   * - Requiere autenticación
   * - Solo retorna si el proyecto está activo
   * - Incluye: lotes, imagenes, suscripciones
   */
  getByIdActive: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}/activo`);
  },

  // =================================================
  // ⚙️ GESTIÓN ADMINISTRATIVA (ADMIN)
  // =================================================

  /**
   * Crea un nuevo proyecto (solo administradores).
   * 
   * @param data - Datos del proyecto a crear
   * @param image - Archivo de imagen opcional (se envía como multipart/form-data)
   * @returns Proyecto creado
   * 
   * @remarks
   * Backend: POST /api/proyectos/
   * - Requiere autenticación y rol admin
   * - Usa FormData para enviar imagen (middleware Multer)
   * - El backend crea el proyecto y asocia lotes iniciales si se proporcionan en `lotesIds`
   * - Envía notificaciones a todos los usuarios activos
   * - La imagen se guarda usando el servicio de imágenes del backend
  */
  create: async (data: CreateProyectoDto, image: File | null): Promise<AxiosResponse<ProyectoDto>> => {
    const formData = new FormData();

    // 1. Agregar los campos del DTO al FormData
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof CreateProyectoDto];
      
      if (value !== undefined && value !== null) {
        // Manejo especial para Arrays (ej: lotesIds)
        if (Array.isArray(value)) {
          value.forEach((val) => formData.append(`${key}[]`, String(val)));
        } else {
          // Convertimos todo a string para el FormData
          formData.append(key, String(value));
        }
      }
    });

    // 2. Agregar la imagen si existe
    if (image) {
      // 'imagen' debe coincidir con el campo que espera tu middleware (Multer) en el backend
      formData.append('imagen', image); 
    }

    // 3. Enviar como multipart/form-data
    return await httpService.post(BASE_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
/**
   * Actualiza un proyecto existente (solo administradores).
   * 
   * @param id - ID del proyecto a actualizar
   * @param data - Datos parciales a actualizar
   * @returns Proyecto actualizado
   * 
   * @remarks
   * Backend: PUT /api/proyectos/:id
   * - Requiere autenticación y rol admin
   * - NO actualiza lotes (usar assignLotes para eso)
   * - NO permite cambiar tipo_inversion después de crear
   * - Actualiza solo los campos proporcionados (PATCH-like)

   */
  update: async (id: number, data: UpdateProyectoDto): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${id}`, data);
  },
/**
   * Asigna lotes a un proyecto existente (solo administradores).
   * 
   * @param idProyecto - ID del proyecto
   * @param lotesIds - Array de IDs de lotes a asignar
   * @returns Mensaje de confirmación y proyecto actualizado
   * 
   * @remarks
   * Backend: PUT /api/proyectos/:id/lotes
   * - Requiere autenticación y rol admin
   * - Operación atómica (transaccional en el backend)
   * - Valida que los lotes no estén ya asignados a otro proyecto
   * - Reemplaza la asociación anterior si existe
   */
  assignLotes: async (idProyecto: number, lotesIds: number[]): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    const data: AsignarLotesDto = { lotesIds };
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/lotes`, data);
  },
/**
   * Inicia o reanuda el proceso de un proyecto mensual (solo administradores).
   * 
   * @param idProyecto - ID del proyecto
   * @returns Mensaje de confirmación y proyecto actualizado
   * 
   * @remarks
   * Backend: PUT /api/proyectos/:id/iniciar-proceso
   * - Requiere autenticación y rol admin
   * - Cambia estado_proyecto a 'En proceso'
   * - Inicia/reanuda el conteo de meses_restantes
   * - Solo aplica a proyectos con tipo_inversion: 'mensual'
   */
  startProcess: async (idProyecto: number): Promise<AxiosResponse<{ mensaje: string, proyecto: ProyectoDto }>> => {
    return await httpService.put(`${BASE_ENDPOINT}/${idProyecto}/iniciar-proceso`);
  },
 /**
   * Obtiene todos los proyectos, incluyendo inactivos (solo administradores).
   * 
   * @returns Lista completa de proyectos
   * 
   * @remarks
   * Backend: GET /api/proyectos/
   * - Requiere autenticación y rol admin
   * - Incluye proyectos activos e inactivos
   * - Útil para gestión administrativa completa

   */
  getAllAdmin: async (): Promise<AxiosResponse<ProyectoDto[]>> => {
    return await httpService.get(BASE_ENDPOINT);
  },
/**
   * Obtiene un proyecto por ID, incluyendo inactivos (solo administradores).
   * 
   * @param id - ID del proyecto
   * @returns Proyecto completo con todas sus relaciones
   * 
   * @remarks
   * Backend: GET /api/proyectos/:id
   * - Requiere autenticación y rol admin
   * - Retorna incluso si el proyecto está inactivo
   * - Incluye todas las relaciones: lotes, imagenes, suscripciones
   */
  getByIdAdmin: async (id: number): Promise<AxiosResponse<ProyectoDto>> => {
    return await httpService.get(`${BASE_ENDPOINT}/${id}`);
  },
/**
   * Desactiva un proyecto (soft delete - solo administradores).
   * 
   * @param id - ID del proyecto a desactivar
   * @returns Mensaje de confirmación
   * 
   * @remarks
   * Backend: DELETE /api/proyectos/:id
   * - Requiere autenticación y rol admin
   * - Soft delete: establece activo: false
   * - El proyecto no se elimina físicamente de la BD
   * - No se puede suscribir a proyectos inactivos

   */
  softDelete: async (id: number): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.delete(`${BASE_ENDPOINT}/${id}`);
  },

 // =================================================
  // 📊 MÉTRICAS (KPIs) - ADMIN
  // =================================================

  /**
   * Obtiene la tasa de culminación de proyectos (KPI).
   * 
   * @returns Métricas de proyectos iniciados vs finalizados
   * 
   * @remarks
   * Backend: GET /api/proyectos/metricas/culminacion
   * - Requiere autenticación y rol admin
   * - Calcula: total_iniciados, total_finalizados, tasa_culminacion
   * - Útil para dashboard administrativo

   */
  getCompletionRate: async (): Promise<CompletionRateDTO> => {
    const { data } = await httpService.get<{ mensaje: string, data: CompletionRateDTO }>(`${BASE_ENDPOINT}/metricas/culminacion`);
    return data.data;
  },
/**
   * Obtiene el avance mensual de suscripciones por proyecto (KPI).
   * 
   * @returns Lista de proyectos con porcentaje de avance
   * 
   * @remarks
   * Backend: GET /api/proyectos/metricas/avance-mensual
   * - Requiere autenticación y rol admin
   * - Calcula porcentaje: (suscripciones_actuales / meta_suscripciones) * 100
   * - Incluye estado del proyecto

   */
  getMonthlyProgress: async (): Promise<MonthlyProgressItem[]> => {
    const { data } = await httpService.get<{ mensaje: string, data: MonthlyProgressItem[] }>(`${BASE_ENDPOINT}/metricas/avance-mensual`);
    return data.data;
  }
};

export default ProyectoService;