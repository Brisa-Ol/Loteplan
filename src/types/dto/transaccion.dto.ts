import type { BaseDTO } from "./base.dto";

export type TipoTransaccion = 
  | 'directo' 
  | 'Puja' 
  | 'pago_suscripcion_inicial' 
  | 'mensual';

export type EstadoTransaccion = 
  | 'pendiente' 
  | 'pagado' 
  | 'fallido' 
  | 'reembolsado' 
  | 'expirado' 
  | 'rechazado_proyecto_cerrado' 
  | 'rechazado_por_capacidad' 
  | 'en_proceso'
  | 'revertido';

// Interfaces auxiliares (Coinciden con los attributes del backend)
interface UsuarioRelacionado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  dni?: string;
}

interface ProyectoRelacionado {
  id: number;
  nombre_proyecto: string;
  tipo_inversion: string;
  estado_proyecto: string;
  moneda: string;
}

interface InversionRelacionada {
  id: number;
  monto: number | string;
  estado: string;
}

interface PagoMensualRelacionado {
  id: number;
  monto: number | string;
  estado_pago: string;
  fecha_vencimiento: string;
  mes: number;
}

interface SuscripcionRelacionada {
  id: number;
  monto_suscripcion: number | string;
  estado: string;
  meses_a_pagar: number;
  meses_pagados: number;
}

interface PujaRelacionada {
  id: number;
  monto_puja: number | string;
  estado: string;
}

interface PagoPasarelaRelacionado {
  id: number;
  monto_pagado: number | string;
  metodo_pasarela: string;
  estado: string;
  id_transaccion_pasarela: string;
}

export interface TransaccionDto extends BaseDTO {
  tipo_transaccion: TipoTransaccion;
  monto: number | string;
  fecha_transaccion: string;
  
  id_usuario: number;
  id_proyecto?: number | null;
  
  // IDs Relacionales
  id_pago_mensual?: number | null;
  id_pago_pasarela?: number | null;
  id_inversion?: number | null;
  id_puja?: number | null;
  id_suscripcion?: number | null;
  
  estado_transaccion: EstadoTransaccion;
  error_detalle?: string | null;

  // 👇 OBJETOS RELACIONADOS (Coinciden con tus alias de associations.js)
  usuario?: UsuarioRelacionado; // as: 'usuario'
  proyectoTransaccion?: ProyectoRelacionado; // as: 'proyectoTransaccion'
  inversion?: InversionRelacionada; // as: 'inversion'
  pagoMensual?: PagoMensualRelacionado; // as: 'pagoMensual'
  suscripcion?: SuscripcionRelacionada; // as: 'suscripcion'
  puja?: PujaRelacionada; // as: 'puja'
  pagoPasarela?: PagoPasarelaRelacionado; // as: 'pagoPasarela'
}

export interface CreateTransaccionDto {
  tipo_transaccion: TipoTransaccion;
  monto: number;
  id_proyecto?: number;
  id_inversion?: number;
  id_puja?: number;
  id_suscripcion?: number;
  id_pago_mensual?: number;
}

export interface UpdateTransaccionDto {
  monto?: number;
  estado_transaccion?: EstadoTransaccion;
  error_detalle?: string;
}

export interface ConfirmarTransaccionResponse {
  mensaje: string;
  transaccion: TransaccionDto;
}