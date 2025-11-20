import type { BaseDTO } from "./base.dto";


// ==========================================
// 📤 REQUEST DTO (Lo que envías al firmar)
// ==========================================

export interface RegistrarFirmaRequestDto {
  // Archivo PDF firmado digitalmente (p.ej. con certificado p12 en el cliente o generado al vuelo)
  file: File; 
  
  id_contrato_plantilla: number;
  id_proyecto: number;
  id_usuario_firmante: number;
  
  // 🔒 Seguridad
  codigo_2fa: string; // TOTP Obligatorio
  
  // 📍 Auditoría (Opcionales pero recomendados)
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
    
    // Información devuelta por la auto-detección del backend
    tipo_autorizacion: 'inversion' | 'suscripcion';
    id_autorizacion: number; 
  };
}

// ==========================================
// 📥 MODELO COMPLETO (Para listados/historial)
// ==========================================

export interface ContratoFirmadoDto extends BaseDTO {
  id_contrato_plantilla: number;
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_firmado: string;
  // firma_digital: string; // Generalmente no se necesita mostrar en el front el string crudo
  fecha_firma: string;
  estado_firma: 'FIRMADO' | 'REVOCADO' | 'INVALIDO';
  
  id_proyecto: number;
  id_usuario_firmante: number;
  
  // Relaciones detectadas
  id_inversion_asociada?: number;
  id_suscripcion_asociada?: number;
  
  // Auditoría
  ip_firma?: string;
  geolocalizacion_firma?: string;
}