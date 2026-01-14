import type { BaseDTO } from "./base.dto";


// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================


/**
 * Datos para crear/inicializar un resumen de cuenta (Admin/Sistema).
 * Usualmente esto ocurre automáticamente al crear la suscripción.
 */
export interface CreateResumenCuentaDto {
  id_suscripcion: number;
  id_proyecto: number;
  
  // Configuración de la cuota base
  nombre_cemento: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  meses_proyecto: number;
  
  // Porcentajes
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
}

export interface UpdateResumenCuentaDto {
  // Permite correcciones manuales de admin
  cuotas_pagadas?: number;
  cuotas_vencidas?: number;
  porcentaje_pagado?: number;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Detalle desglosado de la cuota (guardado como JSON en BD).
 */
export interface DetalleCuotaJson {
  nombre_cemento: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  
  valor_movil: number;
  valor_mensual: number;
  
  porcentaje_plan: number;
  
  // Desglose de costos
  carga_administrativa: number;
  iva_carga_administrativa: number;
  
  // El valor final que paga el usuario
  valor_mensual_final: number;
}

/**
 * Modelo principal de Resumen de Cuenta.
 */
export interface ResumenCuentaDto extends BaseDTO {
  id_suscripcion: number;
  nombre_proyecto: string;
  meses_proyecto: number; // Total de cuotas
  
  // Estado de progreso
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  porcentaje_pagado: number; // Float (0.0 - 100.0)
  
  // Detalles financieros
  detalle_cuota: DetalleCuotaJson;
  
  // Información extra que a veces incluye el backend (en getAccountSummariesByUserId)
  proyecto_info?: {
    nombre_proyecto: string;
    descripcion: string;
  };
}