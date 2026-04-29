import type { BaseDTO } from "./base.dto";

export type PlanPagoAdhesion = 'contado' | '3_cuotas' | '6_cuotas';
export type EstadoAdhesion = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';
export type EstadoPagoAdhesion = 'pendiente' | 'pagado' | 'vencido' | 'cancelado' | 'forzado';

// Interfaces auxiliares basadas en las relaciones del backend
interface ProyectoMinimo {
  id: number;
  nombre_proyecto: string;
  estado_proyecto?: string;
}

interface UsuarioMinimo {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  nombre_usuario?: string;
}

interface SuscripcionMinima {
  id: number;
  activo: boolean;
  adhesion_completada: boolean;
  tokens_disponibles: number;
}
export interface ConfirmarPagoCuotaDto {
  pagoAdhesionId: number;
  codigo_2fa: string;
}

// Respuesta del Paso 1 cuando el usuario tiene 2FA activo (HTTP 202)
export interface IniciarPagoCuotaResponse {
  success?: boolean;
  redirectUrl?: string;       // presente si NO requiere 2FA
  requires2FA?: boolean;      // presente si SÍ requiere 2FA
  message?: string;
  pagoAdhesionId?: number;    // id de la cuota, necesario para el Paso 2
  adhesionId?: number;
  numeroCuota?: number;
}
export interface PagoAdhesionDto extends BaseDTO {
  id_adhesion: number;
  numero_cuota: number;
  monto: string | number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: EstadoPagoAdhesion;
  motivo: string | null;
  id_transaccion: number | null;
}

export interface AdhesionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  id_suscripcion: number;
  valor_movil_referencia: string | number;
  porcentaje_adhesion: string | number;
  monto_total_adhesion: string | number;
  plan_pago: PlanPagoAdhesion;
  cuotas_totales: number;
  cuotas_pagadas: number;
  estado: EstadoAdhesion;
  fecha_completada: string | null;

  // Relaciones opcionales (vienen en los includes del backend)
  pagos?: PagoAdhesionDto[];
  proyecto?: ProyectoMinimo;
  usuario?: UsuarioMinimo;
  suscripcion?: SuscripcionMinima;
}

// Payloads para peticiones
export interface CrearAdhesionDto {
  proyectoId: number;
  planPago: PlanPagoAdhesion;
}

export interface PagarCuotaAdhesionDto {
  adhesionId: number;
  numeroCuota: number;
}

export interface ForzarPagoCuotaDto {
  adhesionId: number;
  numeroCuota: number;
  motivo?: string;
}

export interface CancelarAdhesionDto {
  motivo?: string;
}

// Métricas de Administración
export interface AdhesionMetricsDto {
  total_adhesiones: number;
  estado_resumen: {
    completadas: number;
    en_curso: number;
    pendientes: number;
    canceladas: number;
  };
  montos: {
    monto_total_comprometido: string;
    monto_total_pagado: string;
    monto_pendiente: string;
    monto_vencido: string;
    monto_cancelado: string;
  };
  tasa_cobranza: string | number;
}