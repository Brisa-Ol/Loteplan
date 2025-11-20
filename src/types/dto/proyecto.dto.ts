import type { BaseDTO } from "./base.dto";
import type { ImagenDto } from "./imagen.dto";
import type { LoteDto } from "./lote.dto";
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

export interface UpdateProyectoDto extends Partial<Omit<CreateProyectoDto, 'lotesIds'>> {
  // No incluye lotesIds porque se actualizan en un endpoint separado
  estado_proyecto?: EstadoProyecto;
  activo?: boolean;
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

export interface CompletionRateDto {
  total_iniciados: number;
  total_finalizados: number;
  tasa_culminacion: string; // "XX.XX"
}

export interface MonthlyProgressItemDto {
  id: number;
  nombre: string;
  estado: string;
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string; // "XX.XX"
}