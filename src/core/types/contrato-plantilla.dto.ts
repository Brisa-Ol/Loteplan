import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreatePlantillaDto {
  file: File; // ⚠️ En el FormData debe ir como 'plantillaFile'
  nombre_archivo: string;
  version: number;
  id_proyecto?: number | null; // Puede ser null si es una plantilla genérica inicial
}

export interface UpdatePlantillaPdfDto {
  id: number;
  file: File; // ⚠️ En el FormData debe ir como 'plantillaFile'
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

export interface ContratoPlantillaDto extends BaseDTO {
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_original: string; // Hash SHA-256
  version: number;

  id_proyecto: number | null;
  id_usuario_creacion: number;

  // 🚨 Campo calculado en el backend (integrity check)
  integrity_compromised?: boolean;
  activo: boolean;
}