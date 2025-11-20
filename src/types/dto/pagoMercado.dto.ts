// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

/**
 * Datos para generar un checkout manual/genérico
 * (Usualmente usado si falló el primer intento y se reintenta).
 */
export interface CreateCheckoutGenericoDto {
  id_transaccion?: number; // Si es reintento
  
  // Si es nueva transacción manual
  tipo_transaccion?: 'inversion' | 'pago' | 'puja' | 'recarga';
  monto?: number;
  id_proyecto?: number;
  id_inversion?: number;
  id_puja?: number;
  id_suscripcion?: number;
  
  metodo?: 'mercadopago'; // Por defecto
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Respuesta al iniciar un checkout.
 * Puede ser una redirección directa O pedir 2FA (dependiendo del controlador que lo maneje).
 */
export interface CheckoutResponseDto {
  success?: boolean;
  message?: string;
  
  // Datos clave para la redirección
  redirectUrl?: string; // 🔗 La URL de Mercado Pago
  transaccionId?: number;
  
  // Si el backend pide 2FA antes (Status 202)
  is2FARequired?: boolean;
  pagoId?: number; // Contexto para el 2FA
}

/**
 * Estado detallado de una transacción y su pago en pasarela.
 * Usado en la pantalla de "Resultado de Pago".
 */
export interface PaymentStatusResponseDto {
  transaccion: {
    id: number;
    tipo: string;
    monto: number;
    estado: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado' | 'en_proceso';
    fecha: string; // ISO Date
    
    // Contexto
    id_inversion?: number;
    id_puja?: number;
    id_suscripcion?: number;
    id_proyecto?: number;
  };
  
  // Puede ser null si el usuario cerró MP antes de pagar
  pagoPasarela: {
    id: number;
    transaccionIdPasarela: string; // ID de MP
    monto: number;
    estado: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';
    metodo: string; // ej: credit_card
    fecha: string;
  } | null;
}