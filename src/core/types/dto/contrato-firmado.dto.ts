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

export type ContratoFirmadoListDto = ContratoFirmadoDto[];