import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreatePagoManualDto {
  id_suscripcion: number;
}

export interface ConfirmarPago2faDto {
  pagoId: number;
  codigo_2fa: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

export interface PagoDto extends BaseDTO {
  id_suscripcion: number;
  id_usuario?: number; // ✅ Coincide con tu modelo actualizado
  id_proyecto?: number; // ✅ Coincide con tu modelo actualizado
  
  monto: number; // Sequelize lo devuelve como number gracias al getter
  mes: number;
  fecha_vencimiento: string; // ISO Date Only (YYYY-MM-DD)
  fecha_pago?: string;       // ISO Date Only
  
  estado_pago: 'pendiente' | 'pagado' | 'vencido' | 'cancelado' | 'cubierto_por_puja';
}

/**
 * Respuesta del intento de Checkout (Mensualidad).
 */
export interface PagoCheckoutResponse {
  message: string;
  
  // Caso A: Éxito directo (Status 200) o tras 2FA verificado
  redirectUrl?: string;
  transaccionId?: number;
  monto?: number; // ⚠️ FALTABA ESTE CAMPO que tu backend envía en línea 116
  
  // Caso B: Requiere 2FA (Status 202)
  is2FARequired?: boolean;
  pagoId?: number;
}

// ==========================================
// 📊 MÉTRICAS (ADMIN)
// ==========================================

// Interfaz cruda que viene del backend
export interface RecaudoMensualDTO {
  mes: string; // "MM/YYYY"
  total_recaudado: number;
  anio: number;
  total_pagos_generados: number;
  total_pagos_pendiente?: string; // A veces sequelize retorna strings en counts complejos
  total_pagos_vencidos: number;
  tasa_morosidad: number; // %
  total_pagos_pagados: number;
}

export interface TasaPagosATiempoDTO {
  total_pagados: number;
  pagos_a_tiempo: number;
  anio: number;
  tasa_pagos_a_tiempo: number; // %
}

// ✅ ALIAS: Para que coincidan con tu Service
export type MonthlyMetricsDto = RecaudoMensualDTO;
export type OnTimeMetricsDto = TasaPagosATiempoDTO;