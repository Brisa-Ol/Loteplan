// src/types/dto/proyecto.dto.ts
import type { BaseDTO } from './base.dto';
import type { LoteDTO } from './lote.dto';       // <-- Importar LoteDTO
import type { ImagenDTO } from './imagen.dto';   // <-- Importar ImagenDTO

/**
 * Define los tipos de inversión posibles.
 */
export type TipoInversion = 'directo' | 'mensual';

/**
 * Define los estados posibles para un proyecto.
 */
export type EstadoProyecto = 'En Espera' | 'En proceso' | 'Finalizado';

/**
 * DTO DE SALIDA 
 * Ahora incluye los arrays de lotes e imágenes.
 */
export interface ProyectoDTO extends BaseDTO {
  nombre_proyecto: string;
  descripcion: string | null;
  tipo_inversion: TipoInversion;
  plazo_inversion: number | null;
  forma_juridica: string | null;
  monto_inversion: number | null;
  moneda: string | null;
  suscripciones_actuales: number;
  suscripciones_minimas: number | null;
  obj_suscripciones: number | null;
  objetivo_notificado: boolean;
  estado_proyecto: EstadoProyecto;
  fecha_inicio: string;
  fecha_cierre: string;
  pack_de_lotes: boolean | null;
  fecha_inicio_proceso: string | null;
  meses_restantes: number | null;

  /**
   * ❗ NUEVOS CAMPOS (basado en el 'include' de tu backend)
   * Lista de lotes asociados a este proyecto.
   */
  lotes?: LoteDTO[];

  /**
   * ❗ NUEVOS CAMPOS (basado en el 'include' de tu backend)
   * Lista de imágenes asociadas a este proyecto.
   */
  imagenes?: ImagenDTO[];
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el admin ENVÍA para crear un nuevo proyecto.
 */
export interface CreateProyectoDTO {
  nombre_proyecto: string;
  descripcion?: string | null;
  tipo_inversion: TipoInversion;
  plazo_inversion?: number | null; // Obligatorio si es mensual
  forma_juridica?: string | null;
  monto_inversion: number;        // Obligatorio para ambos tipos
  moneda?: string | null;         // El backend pone default
  suscripciones_minimas?: number | null;
  obj_suscripciones?: number | null; // Obligatorio si es mensual
  fecha_inicio: string;           // "YYYY-MM-DD"
  fecha_cierre: string;           // "YYYY-MM-DD"
  activo?: boolean;

  /**
   * IDs de los lotes a asociar inicialmente (opcional).
   */
  lotesIds?: number[];
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el admin ENVÍA para actualizar un proyecto.
 * (Basado en la función 'update' de tu backend).
 * No permite cambiar tipo_inversion ni lotesIds aquí.
 */
export type UpdateProyectoDTO = Partial<Omit<CreateProyectoDTO, 'tipo_inversion' | 'lotesIds'>>;

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el admin ENVÍA para asignar lotes a un proyecto existente.
 * (Basado en la función 'asignarLotesAProyecto').
 */
export interface AssignLotesDTO {
  lotesIds: number[];
}