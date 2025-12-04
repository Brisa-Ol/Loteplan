import type { BaseDTO } from "./base.dto";

// ==========================================
// 🏭 GESTIÓN DE PLANTILLAS (ADMIN)
// ==========================================

export interface CreatePlantillaDto {
  file: File; // Se enviará como 'plantillaFile'
  nombre_archivo: string;
  version: number;
  id_proyecto?: number | null;
}

export interface UpdatePlantillaPdfDto {
  id: number;
  file: File; // Se enviará como 'plantillaFile'
}

export interface ContratoPlantillaDto extends BaseDTO {
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_original: string;
  version: number;
  id_proyecto: number | null;
  id_usuario_creacion: number;
  integrity_compromised?: boolean; // 🚨 Alerta visual si es true
}

// ==========================================
// ✍️ PROCESO DE FIRMA (USUARIO)
// ==========================================

export interface RegistrarFirmaRequestDto {
  file: File; 
  id_contrato_plantilla: number;
  id_proyecto: number;
  id_usuario_firmante: number;
  
  // 🔒 Seguridad obligatoria del Backend
  codigo_2fa: string; 
  
  // 📍 Auditoría
  latitud_verificacion?: string;
  longitud_verificacion?: string;
}

export interface ContratoFirmadoResponseDto {
  message: string;
  contrato: {
    id: number;
    nombre_archivo: string;
    fecha_firma: string;
    estado_firma: 'FIRMADO' | 'REVOCADO' | 'INVALIDO';
    
    // Info devuelta por la auto-detección
    tipo_autorizacion: 'inversion' | 'suscripcion';
    id_autorizacion: number; 
  };
}

// ==========================================
// 📂 HISTORIAL Y CONSULTAS (GENERAL)
// ==========================================

export interface ContratoFirmadoDto extends BaseDTO {
  id_contrato_plantilla: number;
  nombre_archivo: string;
  url_archivo: string; // Ruta relativa
  hash_archivo_firmado: string;
  fecha_firma: string;
  estado_firma: 'FIRMADO' | 'REVOCADO' | 'INVALIDO';
  
  id_proyecto: number;
  id_usuario_firmante: number;
  
  // Relaciones detectadas por el backend
  id_inversion_asociada?: number;
  id_suscripcion_asociada?: number;
  
  // Auditoría
  ip_firma?: string;
  geolocalizacion_firma?: string;
}

export interface ContratoActionResponse {
  message: string;
  error?: string;
}