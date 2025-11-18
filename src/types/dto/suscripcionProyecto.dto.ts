// src/types/suscripcion_proyecto.dto.ts

/**
 * DTO para iniciar el proceso de suscripción (primer paso)
 */
export interface IniciarSuscripcionDto {
  id_proyecto: number;
}

/**
 * DTO de respuesta al iniciar suscripción
 */
export interface IniciarSuscripcionResponseDto {
  message: string;
  transaccionId: number;
  requiresTwoFA: boolean;
}

/**
 * DTO para confirmar 2FA y generar checkout
 */
export interface Confirmar2FADto {
  transaccionId: number;
  codigo_2fa: string;
}

/**
 * DTO de respuesta al confirmar 2FA
 */
export interface Confirmar2FAResponseDto {
  message: string;
  checkoutUrl: string;
  preferenceId: string;
  transaccionId: number;
}

/**
 * DTO para confirmar el pago (webhook)
 */
export interface ConfirmarPagoDto {
  payment_id: string;
  status: string;
  external_reference: string;
}

/**
 * DTO de respuesta de una suscripción
 */
export interface SuscripcionProyectoDto {
  id: number;
  activo: boolean;
  id_usuario: number;
  id_proyecto: number;
  tokens_disponibles: number;
  meses_a_pagar: number;
  saldo_a_favor: string;
  monto_total_pagado: string;
  proyectoAsociado?: ProyectoSuscripcionDto;
  usuario?: UsuarioSuscripcionDto;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO simplificado de Proyecto (para incluir en Suscripción)
 */
export interface ProyectoSuscripcionDto {
  id: number;
  nombre_proyecto: string;
  descripcion?: string;
  tipo_inversion: 'directo' | 'mensual';
  estado_proyecto: string;
  monto_inversion: string;
  moneda: string;
  fecha_inicio: string;
  fecha_cierre: string;
}

/**
 * DTO simplificado de Usuario (para incluir en Suscripción)
 */
export interface UsuarioSuscripcionDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

/**
 * DTO de una suscripción cancelada
 */
export interface SuscripcionCanceladaDto {
  id: number;
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;
  monto_pagado_total: string;
  fecha_cancelacion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO de métricas de morosidad (KPI)
 */
export interface MetricasMorosidadDto {
  total_pagos_generados: string;
  total_en_riesgo: string;
  tasa_morosidad: string; // Porcentaje como string
}

/**
 * DTO de métricas de cancelación (KPI)
 */
export interface MetricasCancelacionDto {
  total_suscripciones: number;
  total_canceladas: number;
  tasa_cancelacion: string; // Porcentaje como string
}