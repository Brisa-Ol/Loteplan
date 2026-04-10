import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

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

export interface DetalleCuotaJson {
  nombre_cemento: string;
  valor_cemento_unidades: number;
  valor_cemento: number;
  valor_movil: number;
  valor_mensual: number;
  porcentaje_plan: number;
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number;
}

/**
 * Modelo principal de Resumen de Cuenta adaptado a tu Backend actual.
 */
export interface ResumenCuentaDto extends BaseDTO {
  id_suscripcion: number;
  nombre_proyecto: string;
  meses_proyecto: number;
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  porcentaje_pagado: number;
  detalle_cuota: DetalleCuotaJson;
  saldo_a_favor: number;

  // -------------------------------------------------------------
  // 🔗 RELACIONES (Vienen del método findAll() y getById() del Admin)
  // -------------------------------------------------------------
  suscripcion?: {
    id: number;
    id_usuario: number;
    meses_a_pagar?: number; // 🆕
    usuario?: {
      id: number;
      nombre: string;
      apellido: string;
      email: string;
    };
    // Datos del Proyecto asociado a la suscripción
    proyectoAsociado?: {
      id: number;
      nombre_proyecto: string;
      tipo_inversion: string;
      estado_proyecto: string;
    };
  };

  // -------------------------------------------------------------
  // 🔗 FORMATO ALTERNATIVO (Viene de getAccountSummariesByUserId para "Mis Resúmenes")
  // -------------------------------------------------------------
  proyecto_info?: {
    nombre_proyecto: string;
    descripcion: string;
  };
}