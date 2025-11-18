// Archivo: src/types/lote.dto.ts


export interface IImagen {
  id: number;
  url: string;
 
}

/**
 * Interfaz principal basada en tu modelo Sequelize 'Lote'.
 * Esta es la data que recibes de 'findAll', 'findById', etc.
 */
export interface LoteDTO {
  id: number;
  id_proyecto: number | null;
  nombre_lote: string;
  precio_base: string; // DECIMAL se maneja como string
  estado_subasta: 'pendiente' | 'activa' | 'finalizada'; // ENUM
  fecha_inicio: string | null; // DATE se maneja como string ISO
  fecha_fin: string | null; // DATE
  activo: boolean;
  id_puja_mas_alta: number | null;
  id_ganador: number | null;
  intentos_fallidos_pago: number;
  excedente_visualizacion: string; // DECIMAL
  
  // Nuevos campos de geolocalización
  latitud: string | null; // DECIMAL
  longitud: string | null; // DECIMAL

  // Timestamps (si están habilitados)
  fecha_creacion: string;
  fecha_actualizacion: string;

  // Relación (basada en los 'include' de tu servicio)
  imagenes?: IImagen[];
}

/**
 * DTO para crear un nuevo lote.
 * (POST /)
 */
export interface LoteCreateDTO {
  id_proyecto?: number | null;
  nombre_lote: string;
  precio_base: number; // Es más seguro enviar string desde formularios
  estado_subasta?: 'pendiente' | 'activa' | 'finalizada';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  latitud?: string | number | null;
  longitud?: string | number | null;
}

/**
 * DTO para actualizar un lote.
 * (PUT /:id)
 */
export type LoteUpdateDTO = Partial<LoteCreateDTO>;

/**
 * Respuesta genérica para operaciones exitosas que solo devuelven un mensaje.
 * (Ej: DELETE, startAuction, endAuction)
 */
export interface SimpleMessageResponse {
  mensaje: string;
}