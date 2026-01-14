// src/types/dto/pagoMercado.dto.ts

import type { EstadoTransaccion } from './transaccion.dto'; 

// ==========================================
// 📤 REQUEST DTOs
// ==========================================

export interface CreateCheckoutGenericoDto {
  id_transaccion?: number;
  tipo_transaccion?: 'inversion' | 'pago' | 'Puja' | 'recarga' | 'mensual' | 'pago_suscripcion_inicial' | 'directo';
  monto?: number;
  id_proyecto?: number;
  id_inversion?: number;
  id_puja?: number;
  id_suscripcion?: number;
  id_pago_mensual?: number;
  metodo?: 'mercadopago';
}

// ==========================================
// 📥 RESPONSE DTOs
// ==========================================

export interface CheckoutResponseDto {
  success?: boolean;
  message?: string;
  redirectUrl?: string;
  transaccionId?: number;
  is2FARequired?: boolean;
  pagoId?: number;
  inversionId?: number;
  pujaId?: number;
}

/**
 * Estado detallado.
 * Ajustado a tus modelos de Sequelize:
 * - Transaccion: 'pagado', 'fallido', 'reembolsado'
 * - PagoMercado: 'aprobado', 'rechazado', 'devuelto', 'en_proceso', 'pendiente'
 */
export interface PaymentStatusResponseDto {
  transaccion: {
    id: number;
    tipo: string;
    monto: number;
    estado: EstadoTransaccion; // (pendiente, pagado, fallido, reembolsado...)
    fecha: string;
    id_inversion?: number;
    id_puja?: number;
    id_suscripcion?: number;
    id_proyecto?: number;
  };
  
  pagoPasarela: {
    id: number;
    transaccionIdPasarela: string;
    monto: number;
    // ✅ CORREGIDO: Coincide con tu modelo PagoMercado
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'devuelto' | 'en_proceso';
    metodo: string;
    fecha: string;
  } | null;
}