

// ==========================================
// 📤 REQUEST DTOs
// ==========================================

import type { BaseDTO } from "./base.dto";

export interface CreateCuotaMensualDto {
  id_proyecto: number;
  nombre_proyecto: string; // ⚠️ FALTABA ESTE CAMPO REQUERIDO
  
  // Datos de entrada del formulario
  nombre_cemento_cemento?: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  
  // Porcentajes
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
  
  // Opcional: si quisieras forzar el total de cuotas, aunque el back lo saca del proyecto
  total_cuotas_proyecto?: number;
}

export interface UpdateCuotaMensualDto extends Partial<CreateCuotaMensualDto> {}

// ==========================================
// 📥 RESPONSE DTOs
// ==========================================

export interface CuotaMensualDto extends BaseDTO {
  id_proyecto: number;
  nombre_proyecto: string;
  
  nombre_cemento_cemento: string;
  valor_cemento_unidades: number;
  valor_cemento: number; // DECIMAL -> string/number
  
  // Valores Calculados (vienen del back)
  valor_movil: number;
  total_del_plan: number;
  valor_mensual: number;
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number;
  
  createdAt: string;
}