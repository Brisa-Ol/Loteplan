
// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

import type { BaseDTO } from "./base.dto";
import type { ImagenDto } from "./imagen.dto";

export interface CreateLoteDto {
  nombre_lote: string;
  precio_base: number;
  
  // Ubicación
  latitud?: number;
  longitud?: number;
  
  // Asociación (Opcional, si es subasta privada)
  id_proyecto?: number | null;

  // Fechas para subasta programada
  fecha_inicio?: string; // ISO Date
  fecha_fin?: string;    // ISO Date
}

export interface UpdateLoteDto extends Partial<CreateLoteDto> {
  // Permite actualizar campos parciales
  estado_subasta?: 'pendiente' | 'activa' | 'finalizada';
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo principal de Lote.
 */
export interface LoteDto extends BaseDTO {
  nombre_lote: string;
  precio_base: number; // Se recibe como string o number dependiendo de config de axios, idealmente number
  
  // Estado Subasta
  estado_subasta: 'pendiente' | 'activa' | 'finalizada';
  fecha_inicio?: string;
  fecha_fin?: string;
  
  // Relaciones
  id_proyecto: number | null; // null = Lote Público
  id_ganador?: number;
  id_puja_mas_alta?: number;
  
  // Visualización
  imagenes?: ImagenDto[]; // Array de imágenes asociadas
  
  // Geo
  latitud?: number;
  longitud?: number;
  
  // Datos calculados o extras del backend
  intentos_fallidos_pago?: number;
  excedente_visualizacion?: number;
}