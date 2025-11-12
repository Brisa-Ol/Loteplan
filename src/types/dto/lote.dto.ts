// src/types/dto/lote.dto.ts
import type { BaseDTO } from './base.dto';
import type { ImagenDTO } from './imagen.dto';

export type EstadoSubasta = 'pendiente' | 'activa' | 'finalizada';

/**
 * DTO DE SALIDA (Lo que recibes del backend)
 */
export interface LoteDTO extends BaseDTO {
  id_proyecto: number | null;
  nombre_lote: string;
  precio_base: number; // Tu modelo usa DECIMAL, TypeScript usa number
  estado_subasta: EstadoSubasta;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  id_puja_mas_alta: number | null;
  id_ganador: number | null;
  intentos_fallidos_pago: number;
  excedente_visualizacion: number;
  latitud: number | null;
  longitud: number | null;
  imagenes?: ImagenDTO[]; // ❗ Incluye las imágenes
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/**
 * DTO DE ENTRADA (Lo que envías para crear un lote)
 * (Basado en lote.service.js -> create)
 */
export interface CreateLoteDTO {
  nombre_lote: string;
  precio_base: number;
  id_proyecto?: number | null;
  fecha_inicio?: string | null; // "YYYY-MM-DD"
  fecha_fin?: string | null; // "YYYY-MM-DD"
  latitud?: number | null;
  longitud?: number | null;
}

/**
 * DTO DE ENTRADA (Lo que envías para actualizar un lote)
 */
export type UpdateLoteDTO = Partial<CreateLoteDTO & { activo: boolean }>;