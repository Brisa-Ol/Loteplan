import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al Back)
// ==========================================

export interface CreatePlantillaDto {
  file: File;
  nombre_archivo: string;
  version: number;
  id_proyecto?: number | null; 
}

export interface UpdatePlantillaPdfDto {
  id: number;
  file: File;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes del Back)
// ==========================================

/**
 * Reflejo exacto del modelo Sequelize 'ContratoPlantilla'.
 */
export interface ContratoPlantillaDto extends BaseDTO {
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_original: string;
  version: number;
  
  // ✅ Coincide con allowNull: true del Back
  id_proyecto: number | null; 
  
  // ✅ Coincide con allowNull: true del Back
  id_usuario_creacion: number | null; 

  // Este campo no está en DB, pero si tu Controller lo calcula, 
  // lo dejamos opcional. Si no viene, no pasa nada.
  integrity_compromised?: boolean; 
}

/**
 * Estructura para solucionar el error "Property 'id' does not exist".
 * Asumimos que tu Controller responde: { message: "...", plantilla: { ... } }
 */
export interface ContratoActionResponse {
  message: string;
  plantilla: ContratoPlantillaDto; 
}