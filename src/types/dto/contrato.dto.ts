import type { BaseDTO } from "./base.dto";

// ==========================================
// 🏭 GESTIÓN DE PLANTILLAS (ADMIN)
// ==========================================

export interface CreatePlantillaDto {
  file: File; // Se enviará como 'plantillaFile' en el FormData
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
  integrity_compromised?: boolean; // 🚨 Alerta visual si el hash no coincide
  activo: boolean;
}

// ==========================================
// ✍️ PROCESO DE FIRMA (REQ USUARIO)
// ==========================================

export interface RegistrarFirmaRequestDto {
  file: File; // El PDF firmado
  
  // IDs Contextuales
  id_contrato_plantilla: number; // Backend espera este nombre exacto
  id_proyecto: number;
  id_usuario_firmante: number;
  
  // 🔒 Seguridad obligatoria del Backend
  hash_archivo_firmado: string; // Hash SHA-256 calculado en el front
  codigo_2fa: string;           // Código del Authenticator
  
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
    
    // Info devuelta por la auto-detección del backend
    tipo_autorizacion: 'inversion' | 'suscripcion';
    id_autorizacion: number; 
  };
}

// ==========================================
// 📂 HISTORIAL Y CONSULTAS (RES USUARIO/ADMIN)
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
  integrity_compromised?: boolean;
}

export interface ContratoActionResponse {
  message: string;
  error?: string;
}