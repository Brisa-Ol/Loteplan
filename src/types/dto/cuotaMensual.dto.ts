import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al crear)
// ==========================================

export interface CreateCuotaMensualDto {
  id_proyecto: number;
  nombre_proyecto: string;        // ✅ Requerido por tu Backend
  total_cuotas_proyecto: number;  // ✅ Requerido por tu Backend (plazo_inversion)
  
  // Configuración
  nombre_cemento_cemento?: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  
  // Porcentajes
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
}

export interface UpdateCuotaMensualDto extends Partial<CreateCuotaMensualDto> {}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

export interface CuotaMensualDto extends BaseDTO {
  id_proyecto: number;
  nombre_proyecto: string;
  total_cuotas_proyecto: number;

  nombre_cemento_cemento: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  
  // Porcentajes
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;

  // Valores Calculados (Vienen del Back)
  valor_movil: number;
  total_del_plan: number;
  valor_mensual: number;
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number;
  
  createdAt: string;
}