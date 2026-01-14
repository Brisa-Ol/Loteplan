import type { BaseDTO } from "./base.dto";
import type { ImagenDto } from "./imagen.dto";
import type { LoteDto } from "./lote.dto";

/**
 * DTOs para la gestión de proyectos.
 * 
 * @remarks
 * Los tipos están alineados con el modelo `Proyecto` del backend (Sequelize).
 * - El backend valida que tipo_inversion sea 'directo' o 'mensual'
 * - Los proyectos mensuales tienen plazo_inversion (meses)
 * - Los proyectos directos tienen monto_inversion fijo
 * - Soft delete: activo: true/false
 * 
 * @see {@link https://github.com/.../models/proyecto.js} Modelo Backend
 */

// ==========================================
// 🛠️ ENUMS & TYPES
// ==========================================

/**
 * Tipo de inversión del proyecto.
 * - 'directo': Pago único, adjudicación inmediata
 * - 'mensual': Cuotas mensuales, adjudicación desde cuota 12
 */
export type TipoInversion = 'directo' | 'mensual';

/**
 * Estado del proyecto en su ciclo de vida.
 * - 'En Espera': Creado pero no iniciado
 * - 'En proceso': Activo, aceptando suscripciones
 * - 'Finalizado': Completado, no acepta más suscripciones
 */
export type EstadoProyecto = 'En Espera' | 'En proceso' | 'Finalizado';

/**
 * Moneda en la que se maneja el proyecto.
 * - 'USD': Dólares estadounidenses
 * - 'ARS': Pesos argentinos
 */
export type MonedaProyecto = 'USD' | 'ARS';

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

/**
 * Datos para crear un nuevo proyecto.
 * 
 * @remarks
 * Backend: POST /api/proyectos/
 * - Requiere autenticación y rol admin
 * - El backend crea el proyecto y asocia lotes iniciales si se proporcionan
 * - Envía notificaciones a todos los usuarios activos
 * - La imagen se envía como multipart/form-data
 * 
 * @example
 * ```typescript
 * const proyecto = {
 *   nombre_proyecto: "Proyecto Nuevo",
 *   tipo_inversion: "mensual",
 *   monto_inversion: 50000,
 *   plazo_inversion: 24,
 *   moneda: "ARS",
 *   fecha_inicio: "2024-01-01",
 *   fecha_cierre: "2024-12-31",
 *   lotesIds: [1, 2, 3]
 * };
 * ```
 */
export interface CreateProyectoDto {
  nombre_proyecto: string;
  descripcion?: string;
  tipo_inversion: TipoInversion;
  moneda: MonedaProyecto;
  
  // Configuración Financiera
  monto_inversion: number; // Costo total o cuota mensual
  plazo_inversion?: number; // Solo para mensual (meses)
  forma_juridica?: string;
  
  // Configuración Suscripción
  obj_suscripciones?: number;
  suscripciones_minimas?: number;
  
  // Fechas
  fecha_inicio: string; // YYYY-MM-DD
  fecha_cierre: string; // YYYY-MM-DD
  
  // Ubicación
  latitud?: number;
  longitud?: number;
  
  // Relaciones Iniciales
  lotesIds?: number[]; // IDs de lotes para asociar al crear
}

export interface UpdateProyectoDto extends Partial<Omit<CreateProyectoDto, 'lotesIds' | 'tipo_inversion'>> {
  // No incluye lotesIds porque se actualizan en un endpoint separado
  // No incluye tipo_inversion porque no debería cambiar después de crear el proyecto
  
  estado_proyecto?: EstadoProyecto;
  activo?: boolean;
  moneda?: MonedaProyecto; // ✅ AGREGADO: Permite actualizar la moneda
}

export interface AsignarLotesDto {
  lotesIds: number[];
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

export interface ProyectoDto extends BaseDTO {
  nombre_proyecto: string;
  descripcion: string;
  
  tipo_inversion: TipoInversion;
  estado_proyecto: EstadoProyecto;
  
  // Datos Financieros
  monto_inversion: number;
  moneda: MonedaProyecto;
  plazo_inversion?: number;
  forma_juridica?: string;
  
  // Datos de Progreso
  suscripciones_actuales: number;
  suscripciones_minimas: number;
  obj_suscripciones: number;
  objetivo_notificado: boolean;
  
  // Datos de Tiempo
  fecha_inicio: string;
  fecha_cierre: string;
  fecha_inicio_proceso?: string;
  meses_restantes?: number;
  
  // Configuración
  pack_de_lotes: boolean;
  
  // Ubicación
  latitud?: number;
  longitud?: number;
  
  // Relaciones (Includes)
  lotes?: LoteDto[];
  imagenes?: ImagenDto[];
}

// ==========================================
// 📊 MÉTRICAS (ADMIN)
// ==========================================

export interface CompletionRateDTO  {
  total_iniciados: number;
  total_finalizados: number;
  tasa_culminacion: string; 
}

export interface MonthlyProgressItem  {
  id: number;
  nombre: string;
  estado: EstadoProyecto;
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string;
}