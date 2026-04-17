// src/types/dto/lote.dto.ts

import type { BaseDTO } from "./base.dto";
import type { ImagenDto } from "./imagen.dto";
import type { EstadoPuja } from "./puja.dto";

// ==========================================
// 🛠️ ENUMS & TYPES
// ==========================================

export type EstadoSubasta = 'pendiente' | 'activa' | 'finalizada';
export type TipoInversion = 'directo' | 'mensual';
export type EstadoProyecto = 'En Espera' | 'En proceso' | 'Finalizado';

// ==========================================
// 📥 RESPONSE DTO (Lo que recibes del Backend)
// ==========================================

/**
 * DTO Principal de Lote
 * Alineado 100% con el modelo Sequelize Lote.js y Proyecto.js
 */
export interface LoteDto extends BaseDTO {
  // 1. Identificadores
  id_proyecto: number | null;

  // 2. Datos básicos
  nombre_lote: string;
  precio_base: string;
  monto_ganador_lote: string | null;
  ultima_puja?: {
    id: number;
    monto: string | number;
    id_usuario: number;
    fecha_puja: string;
  };

  // 3. Estado y Tiempos
  estado_subasta: EstadoSubasta;
  fecha_inicio: string | null;
  fecha_fin: string | null;

  // 4. Relaciones de Subasta (Foreign Keys)
  id_puja_mas_alta: number | null;
  id_ganador: number | null;
  pujaMasAlta?: {
    id: number;
    monto_puja: string;
    estado_puja: EstadoPuja;
  } | null;
  // 5. Campos de Control (Críticos según tu modelo)
  intentos_fallidos_pago: number;
  excedente_visualizacion: number;
  excluir_estadisticas: boolean;
  // 6. Ubicación Geográfica
  latitud: number | null;
  longitud: number | null;
  map_url: string | null
  // 7. Relaciones (Includes opcionales)
  imagenes?: ImagenDto[];
  proyecto?: ProyectoMinimalDto; // 👈 Ahora contiene la lógica del Back
  ganador?: UsuarioMinimalDto;
  pujas?: any[];
  proyectoLote?: {
              id: number,
              nombre_proyecto: string,
              tipo_inversion: string,
              estado_proyecto: string,
          }
}

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

export interface CreateLoteDto {
  id_proyecto?: number | null;
  nombre_lote: string;
  precio_base: string;
  estado_subasta?: EstadoSubasta;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface UpdateLoteDto extends Partial<CreateLoteDto> {
  activo?: boolean;
  id_ganador?: number | null;
  id_puja_mas_alta?: number | null;
  intentos_fallidos_pago?: number;
  excedente_visualizacion?: number;
  monto_ganador_lote?: string | null;
  map_url?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

// ==========================================
// 🧩 DTOs AUXILIARES (Sincronizados con tu Back)
// ==========================================

/**
 * Refleja fielmente el modelo Proyecto.js del Backend
 */
export interface ProyectoMinimalDto extends BaseDTO {
  nombre_proyecto: string;
  descripcion?: string;
  plazo_inversion?: number;
  monto_inversion: string | number;
  moneda: string;                // "USD" | "ARS"
  suscripciones_actuales: number;
  suscripciones_minimas: number;
  obj_suscripciones: number;
  pack_de_lotes: boolean;        // 👈 Tu campo crítico
  fecha_inicio: string;
  fecha_cierre: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface UsuarioMinimalDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nombre_usuario?: string;
  // ✅ NUEVOS: Campos de contacto incluidos ahora en los services del back
  dni?: string;
  numero_telefono?: string;
}

// ==========================================
// 🚀 RESPUESTAS DE ACCIONES
// ==========================================

export interface StartAuctionResponse {
  mensaje: string;
  lote?: LoteDto;
}

export interface EndAuctionResponse {
  mensaje: string;
  lote?: LoteDto;
  ganador?: {
    id: number;
    nombre: string;
  };
  transaccion?: {
    id: number;
  };
}