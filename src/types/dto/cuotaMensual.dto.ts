// src/types/dto/cuotaMensual.dto.ts
import type { BaseDTO } from './base.dto'; // Asumiendo que existe

/**
 * DTO DE SALIDA (Lo que recibes del backend)
 */
export interface CuotaMensualDTO extends BaseDTO {
  id_proyecto: number;
  nombre_proyecto: string;
  nombre_cemento_cemento: string | null;
  valor_cemento_unidades: number;
  valor_cemento: number;
  total_cuotas_proyecto: number;
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
  valor_movil: number;
  total_del_plan: number;
  valor_mensual: number;
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number;
}

/**
 * DTO DE ENTRADA (Lo que envías para crear una cuota)
 * (Basado en cuotaMensual.controller.js -> create)
 */
export interface CreateCuotaMensualDTO {
  id_proyecto: number;
  nombre_cemento_cemento?: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
}