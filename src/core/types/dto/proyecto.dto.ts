import type { BaseDTO } from "./base.dto";
import type { ImagenDto } from "./imagen.dto";
import type { LoteDto } from "./lote.dto";

/**
 * DTOs para la gestión de proyectos.
 * * @remarks
 * Los tipos están alineados 100% con el modelo `Proyecto` del backend (Sequelize).
 */

// ==========================================
// 🛠️ ENUMS & TYPES
// ==========================================

export type TipoInversion = 'directo' | 'mensual';
export type EstadoProyecto = 'En Espera' | 'En proceso' | 'Finalizado';
export type MonedaProyecto = 'USD' | 'ARS';

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreateProyectoDto {
  nombre_proyecto: string;
  descripcion?: string;
  tipo_inversion: TipoInversion;
  moneda: MonedaProyecto;
  
  // Configuración Financiera
  monto_inversion: number; 
  plazo_inversion?: number; 
  forma_juridica?: string;
  
  // Configuración Suscripción
  obj_suscripciones?: number;
  suscripciones_minimas?: number; // ✅ Sincronizado con el modelo
  
  // Fechas
  fecha_inicio: string; 
  fecha_cierre: string; 
  
  // Ubicación
  latitud?: number;
  longitud?: number;
  
  // Relaciones Iniciales
  lotesIds?: number[]; 
}

export interface UpdateProyectoDto extends Partial<Omit<CreateProyectoDto, 'lotesIds' | 'tipo_inversion'>> {
  estado_proyecto?: EstadoProyecto;
  activo?: boolean;
  moneda?: MonedaProyecto;
  objetivo_notificado?: boolean; // ✅ Permite actualizar estado de notificación
}

export interface AsignarLotesDto {
  lotesIds: number[];
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * ProyectoDto extendiendo de BaseDTO para incluir:
 * id, activo, fecha_creacion y fecha_actualizacion
 */
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
  
  // Datos de Progreso (Sincronizados con Sequelize)
  suscripciones_actuales: number;
  suscripciones_minimas: number; // ✅ Agregado del modelo
  obj_suscripciones: number;
  objetivo_notificado: boolean; // ✅ Agregado del modelo
  valor_cuota_referencia?: number; // Este mapea a cuota.valor_mensual_final
  nombre_cemento_cemento?: string; 
  valor_cemento?: number;
  // Datos de Tiempo
  fecha_inicio: string;
  fecha_cierre: string;
  fecha_inicio_proceso?: string; // ✅ DATEONLY en Back
  meses_restantes?: number;      // ✅ Integer en Back
  
  // Configuración
  pack_de_lotes: boolean; // 👈 Tu campo crítico del modelo
  
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

export interface CompletionRateDTO {
  total_iniciados: number;
  total_finalizados: number;
  tasa_culminacion: string; 
}

export interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: EstadoProyecto;
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string;
}