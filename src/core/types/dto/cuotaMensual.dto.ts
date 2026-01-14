import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs
// ==========================================

export interface CreateCuotaMensualDto {
  id_proyecto: number;
  // Estos dos campos el backend los calcula, pero si los usas para validación visual en front, déjalos.
  nombre_proyecto?: string;        
  total_cuotas_proyecto?: number; 
  
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
// 📥 RESPONSE DTOs
// ==========================================

// 1. La forma de la cuota pura en DB
export interface CuotaMensualDto extends BaseDTO {
  id_proyecto: number;
  nombre_proyecto: string;
  total_cuotas_proyecto: number;
  nombre_cemento_cemento: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;

  valor_movil: number;
  total_del_plan: number;
  valor_mensual: number;
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number;
  
  createdAt: string;
}

// 2. 🆕 La respuesta real del Backend (Wrapper)
export interface CuotaBackendResponse {
    success: boolean;
    mensaje?: string;
    cuota: CuotaMensualDto;
    sincronizacion?: {
        resumenes_actualizados: number;
        mensaje: string;
    };
}