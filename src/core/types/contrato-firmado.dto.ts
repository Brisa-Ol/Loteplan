import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTO (Lo que envías al firmar)
// ==========================================

export interface RegistrarFirmaRequestDto {
  file: File; // Archivo PDF firmado

  // IDs Contextuales
  id_contrato_plantilla: number;
  id_proyecto: number;
  id_usuario_firmante: number;

  // 🔒 Seguridad
  hash_archivo_firmado: string; // Hash SHA-256 calculado en el front
  codigo_2fa: string;           // TOTP Obligatorio

  // 📍 Auditoría
  latitud_verificacion?: string;
  longitud_verificacion?: string;
}

// ==========================================
// 📥 RESPONSE DTO (Lo que recibes tras firmar)
// ==========================================

export interface ContratoFirmadoResponseDto {
  message: string;
  contrato: {
    id: number;
    nombre_archivo: string;
    fecha_firma: string;
    estado_firma: 'FIRMADO' | 'REVOCADO' | 'INVALIDO';
    url_archivo: string; // ✅ Agrégalo aquí
    tipo_autorizacion: 'inversion' | 'suscripcion';
    id_autorizacion: number;
  };
}

// ==========================================
// 📥 MODELO COMPLETO (Para listados/historial)
// ==========================================

export interface ContratoFirmadoDto extends BaseDTO {
  id_contrato_plantilla: number;

  // Metadatos
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_firmado: string;
  firma_digital: string;
  // Datos de firma
  fecha_firma: string;
  estado_firma: 'FIRMADO' | 'REVOCADO' | 'INVALIDO';

  // Contexto
  id_proyecto: number;
  id_usuario_firmante: number;

  // Relaciones detectadas
  id_inversion_asociada?: number;
  id_suscripcion_asociada?: number;

  // Auditoría
  ip_firma?: string;
  geolocalizacion_firma?: string;
  integrity_compromised?: boolean;
  usuarioFirmante?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario: string;
  };

  proyectoAsociado?: {
    id: number;
    nombre_proyecto: string;
    tipo_inversion: string;
    estado_proyecto: string;
  };
}
// ==========================================
// 🔎 TRACKING DTO (Verificación de Elegibilidad)
// ==========================================

export interface EntidadPagadoraTrackDto {
  tipo: 'inversion' | 'suscripcion';
  id: number;
  monto?: number | string;
  fecha?: string;
  estado?: string;
  adhesion_id?: number;
  adhesion_estado?: string;
  cuotas_pagadas?: number;
  cuotas_totales?: number;
}

export interface SuscripcionDetalleTrackDto {
  suscripcion_id: number;
  adhesion_id: number | null;
  tiene_pago_adhesion: boolean;
  cuotas_pagadas: number;
  cuotas_totales: number;
  adhesion_estado: string | null;
  tiene_contrato_firmado: boolean;
  puede_firmar: boolean;
  contrato_firmado: {
    id: number;
    nombre_archivo: string;
    url_archivo: string;
    fecha_firma: string;
    estado_firma: string;
    id_contrato_plantilla: number;
  } | null;
}

export interface TrackPaymentAndContractResponseDto {
  tiene_pago: boolean;
  tiene_contrato_firmado: boolean;
  puede_firmar: boolean;
  entidad_pagadora: EntidadPagadoraTrackDto | null;
  contrato_firmado: any | null; // Puedes usar un Pick<ContratoFirmadoDto, ...> si prefieres
  proyecto: {
    id: number;
    nombre: string;
    tipo_inversion: string;
  };
  mensaje: string;
  suscripciones_detalle?: SuscripcionDetalleTrackDto[]; // Solo viene si es un proyecto mensual
}
export type ContratoFirmadoListDto = ContratoFirmadoDto[];