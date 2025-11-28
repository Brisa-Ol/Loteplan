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
  id_usuario?: number;
  id_proyecto?: number;
  
  monto: number;
  mes: number;
  fecha_vencimiento: string; // ISO Date Only (YYYY-MM-DD)
  fecha_pago?: string;       // ISO Date Only
  
  estado_pago: 'pendiente' | 'pagado' | 'vencido' | 'cancelado' | 'cubierto_por_puja';
}

/**
 * Respuesta del intento de Checkout (Mensualidad).
 * Idéntica estructura lógica que Inversiones.
 */
export interface PagoCheckoutResponse {
  message: string;
  
  // Caso A: Redirección directa
  redirectUrl?: string;
  transaccionId?: number;
  
  // Caso B: Requiere 2FA (Status 202)
  is2FARequired?: boolean;
  pagoId?: number;
}

// ==========================================
// 📊 MÉTRICAS (ADMIN)
// ==========================================

export interface RecaudoMensualDTO {
  mes: string; // "MM/YYYY"
  total_recaudado: number;
  anio: number;
  total_pagos_generados: number;
  total_pagos_pendiente: string;
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