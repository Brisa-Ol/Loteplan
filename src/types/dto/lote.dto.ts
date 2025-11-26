import type { BaseDTO } from "./base.dto";
import type { ImagenDto } from "./imagen.dto";

// ==========================================
// 🛠️ TYPES
// ==========================================
export type EstadoSubasta = 'pendiente' | 'activa' | 'finalizada';

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreateLoteDto {
  nombre_lote: string;
  precio_base: number;
  
  // Asociación (Opcional, si es subasta privada)
  id_proyecto?: number | null; // null = Lote Público

  // Ubicación (Ahora obligatorios en el tipo, opcionales en lógica)
  latitud?: number | null;
  longitud?: number | null;

  // Fechas para subasta programada
  fecha_inicio?: string; // ISO Date
  fecha_fin?: string;    // ISO Date
}

export interface UpdateLoteDto extends Partial<CreateLoteDto> {
  // Permite actualizar campos parciales + campos exclusivos de update
  activo?: boolean;
  estado_subasta?: EstadoSubasta;
  
  // Admin puede forzar estos campos manualmente
  id_ganador?: number | null;
  intentos_fallidos_pago?: number;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo principal de Lote.
 * Refleja la estructura de la base de datos (Lote.js).
 */
export interface LoteDto extends BaseDTO {
  nombre_lote: string;
  precio_base: number; // Viene como string '1500.00' del decimal, convertir a Number en front
  
  // Estado Subasta
  estado_subasta: EstadoSubasta;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  
  // Relaciones
  id_proyecto: number | null; 
  id_ganador: number | null;
  id_puja_mas_alta: number | null;
  
  // Visualización
  imagenes?: ImagenDto[]; 
  
  // Geo
  latitud?: number | null;
  longitud?: number | null;
  
  // Datos calculados o extras del backend
  intentos_fallidos_pago: number;
  excedente_visualizacion: number;
}