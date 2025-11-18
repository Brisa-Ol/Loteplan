// src/types/proyecto.dto.ts

// ----------------------------------------------------------
// PROYECTO — CREATE
// ----------------------------------------------------------

export interface CreateProyectoDto {
  nombre_proyecto: string;
  descripcion?: string;
  tipo_inversion: "directo" | "mensual";
  plazo_inversion?: number;
  forma_juridica?: string;
  monto_inversion: string; // siempre string
  moneda?: string;
  obj_suscripciones?: number;
  suscripciones_minimas?: number;
  fecha_inicio: string; 
  fecha_cierre: string; 
  pack_de_lotes?: boolean;
  latitud?: string | null;
  longitud?: string | null;
  lotesIds?: number[];
}

// ----------------------------------------------------------
// PROYECTO — UPDATE
// ----------------------------------------------------------

export interface ProyectoUpdateDTO {
  nombre_proyecto?: string;
  descripcion?: string;
  tipo_inversion?: "directo" | "mensual";
  plazo_inversion?: number;
  forma_juridica?: string;
  monto_inversion?: string;
  moneda?: string;
  obj_suscripciones?: number;
  suscripciones_minimas?: number;
  fecha_inicio?: string;
  fecha_cierre?: string;
  pack_de_lotes?: boolean;
  latitud?: string | null;
  longitud?: string | null;
  estado_proyecto?: "En Espera" | "En proceso" | "Finalizado";
}

// ----------------------------------------------------------
// PROYECTO — RESPONSE
// ----------------------------------------------------------

export interface ProyectoDTO {
  id: number;
  activo: boolean;
  nombre_proyecto: string;
  descripcion?: string;
  tipo_inversion: "directo" | "mensual";
  plazo_inversion?: number;
  forma_juridica?: string;
  monto_inversion: string;
  moneda: string;
  suscripciones_actuales: number;
  suscripciones_minimas: number;
  obj_suscripciones?: number | null;
  objetivo_notificado: boolean;
  estado_proyecto: "En Espera" | "En proceso" | "Finalizado";
  fecha_inicio: string;
  fecha_cierre: string;
  pack_de_lotes: boolean;
  fecha_inicio_proceso?: string | null;
  meses_restantes?: number | null;

  // ubicaciones como string (coincide con Sequelize DECIMAL)
  latitud?: string | null;
  longitud?: string | null;

  lotes?: LoteDto[];
  imagenes?: ImagenDTO[];

  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------
// LOTE SIMPLIFICADO
// ----------------------------------------------------------

export interface LoteDto {
  id: number;
  nombre_lote: string;
  precio_base?: string;
  id_proyecto?: number;
  ubicacion?: string;          // opcional (frontend)
  estado_lote?: string;        // opcional
}

// ----------------------------------------------------------
// IMAGEN SIMPLIFICADA
// ----------------------------------------------------------

export interface ImagenDTO {
  id: number;
  url: string;
  descripcion?: string;
  id_proyecto: number;
}

// ----------------------------------------------------------
// ASIGNAR LOTES
// ----------------------------------------------------------

export interface AsignarLotesDto {
  lotesIds: number[];
}

// ----------------------------------------------------------
// MÉTRICAS (KPIs)
// ----------------------------------------------------------

// KPI 4 — Tasa de Culminación
export interface MetricasCulminacionDto {
  total_iniciados: number;
  total_finalizados: number;
  tasa_culminacion: string; // porcentaje como string
}

// ✔ tu API devuelve ESTE OBJETO directamente
export type CompletionRateResponse = MetricasCulminacionDto;

// KPI 5 — Avance mensual
export interface ProgresoMensualProyectoDto {
  id: number;
  nombre: string;
  estado: "En Espera" | "En proceso" | "Finalizado";
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string;
}

export type MetricasAvanceMensualDto = ProgresoMensualProyectoDto[];

// API response estandarizada
export interface MonthlyProgressResponse {
  data: MetricasAvanceMensualDto;
}
