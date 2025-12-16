import type { BaseDTO } from './base.dto';

// ✅ COINCIDE CON: DataTypes.ENUM("PENDIENTE", "APROBADA", "RECHAZADA")
// Agregamos 'NO_INICIADO' para el manejo seguro en el frontend.
export type EstadoVerificacion = 'NO_INICIADO' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

// ✅ COINCIDE CON: DataTypes.ENUM("DNI", "PASAPORTE", "LICENCIA")
export type TipoDocumento = 'DNI' | 'PASAPORTE' | 'LICENCIA';

/**
 * DTO PRINCIPAL (Refleja la tabla 'verificacion_identidad' + JOIN con 'usuario')
 */
export interface KycDTO extends BaseDTO {
  // --- CAMPOS DIRECTOS DEL MODELO ---
  
  id_usuario: number; // FK
  
  // Datos Personales
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string; // DataTypes.DATEONLY llega como string "YYYY-MM-DD"
  
  // URLs de Archivos (DataTypes.STRING)
  url_foto_documento_frente: string;
  url_foto_documento_dorso: string | null; // AllowNull: true en modelo
  url_foto_selfie_con_documento: string;
  url_video_verificacion: string | null;   // AllowNull: true en modelo
  
  // Estado y Gestión
  estado_verificacion: EstadoVerificacion;
  id_verificador?: number; // Puede ser null si nadie lo ha revisado
  fecha_verificacion?: string; // DataTypes.DATE llega como string ISO
  motivo_rechazo?: string;     // DataTypes.TEXT
  
  // Metadatos Técnicos
  latitud_verificacion?: number;  // DataTypes.DECIMAL
  longitud_verificacion?: number; // DataTypes.DECIMAL
  ip_verificacion?: string;       // DataTypes.STRING

  // --- 🚀 RELACIÓN (JOIN) ---
  // Esto existe gracias a: VerificacionIdentidad.belongsTo(Usuario, { as: "usuario" })
  // Solo vendrá lleno si usas 'include' en el backend.
  usuario?: {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    dni?: string;
    nombre_usuario?: string;
    numero_telefono?: string;
    rol?: string;

  };

  
verificador?: {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    nombre_usuario?: string;
    rol?: string;
  };

  // --- 🛠 HELPERS DE LÓGICA DE NEGOCIO ---
  // Estos campos NO están en la tabla, pero tu Controller los calcula y envía.
  puede_enviar?: boolean; 
  mensaje_estado?: string;
}

/**
 * DTO PARA ESTADO DE USUARIO
 * Es una versión "segura" para mostrar en el perfil del cliente.
 * Omitimos URLs sensibles que no son necesarias para ver el estado.
 */
export type KycStatusDTO = Omit<
  KycDTO, 
  | 'url_foto_documento_frente' 
  | 'url_foto_documento_dorso' 
  | 'url_foto_selfie_con_documento' 
  | 'url_video_verificacion'
  | 'ip_verificacion'
>;

/**
 * DTO DE ENTRADA (Formulario de React)
 * Lo que envías al endpoint /submit en FormData
 */
export interface SubmitKycDto {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  
  // En el Front usamos 'File' (blob), el Back los recibe y convierte a URLs
  documento_frente: File;
  documento_dorso?: File;
  selfie_con_documento: File;
  video_verificacion?: File;
  
  latitud_verificacion?: number;
  longitud_verificacion?: number;
}

/**
 * DTO DE ENTRADA (Admin - Rechazo)
 */
export interface RejectKycDTO {
  motivo_rechazo: string;
}