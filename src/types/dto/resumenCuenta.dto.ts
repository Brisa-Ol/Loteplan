// src/types/dto/resumenCuenta.dto.ts

/**
 * ❗ Define la estructura del objeto DENTRO del campo JSON 'detalle_cuota'.
 * BASADO en la función 'createAccountSummary' de tu backend.
 * Asegúrate de que estos campos coincidan con lo que realmente guardas.
 */
export interface DetalleCuotaConfig {
  nombre_cemento: string | null;
  valor_cemento_unidades: number;
  valor_cemento: number;
  porcentaje_plan: number;
  valor_movil: number;
  valor_mensual: number; // Valor base mensual sin cargos
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number; // Monto total que se cobrará
}

/**
 * ❗ DTO DE SALIDA PRINCIPAL
 * Representa el resumen de cuenta que RECIBIMOS del backend.
 */
export interface ResumenCuentaDTO {
  id: number;
  id_suscripcion: number;
  nombre_proyecto: string;
  meses_proyecto: number; // Total de meses del plan
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  porcentaje_pagado: number;

  /**
   * El campo JSONB se mapea a nuestra interfaz DetalleCuotaConfig.
   */
  detalle_cuota: DetalleCuotaConfig;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ❗ DTO DE SALIDA ESPECÍFICO (NUEVO)
 * Representa la estructura devuelta por 'getAccountSummariesByUserId'.
 * Incluye información anidada del proyecto.
 */
export interface UserAccountSummaryDTO extends ResumenCuentaDTO {
  proyecto_info?: { // Puede ser opcional si alguna suscripción no tiene proyecto asociado
    nombre_proyecto: string;
    descripcion: string | null;
  };
}

/**
 * ❗ DTO DE ENTRADA (NUEVO - Admin)
 * Datos que el admin ENVÍA para actualizar un resumen (raro, pero posible).
 */
export type UpdateResumenCuentaDTO = Partial<{
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  porcentaje_pagado: number;
  // 'detalle_cuota' probablemente no se actualiza manualmente
}>;