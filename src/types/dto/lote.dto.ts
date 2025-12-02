// src/types/dto/lote.dto.ts

import type { ImagenDto } from "./imagen.dto";

// ==========================================
// 🛠️ ENUMS & TYPES
// ==========================================

export type EstadoSubasta = 'pendiente' | 'activa' | 'finalizada';

// ==========================================
// 📥 RESPONSE DTO (Lo que recibes del Backend)
// ==========================================

/**
 * DTO Principal de Lote
 * Alineado 100% con el modelo Sequelize Lote.js
 */
export interface LoteDto {
  // 1. Identificadores
  id: number;
  id_proyecto: number | null; // allowNull: true en BD

  // 2. Datos básicos
  nombre_lote: string;
  precio_base: number; // En BD es DECIMAL, Sequelize lo devuelve como string, pero en TS lo tipamos number para operar

  // 3. Estado y Tiempos
  estado_subasta: EstadoSubasta;
  fecha_inicio: string | null; // DataTypes.DATE devuelve string ISO
  fecha_fin: string | null;
  activo: boolean;

  // 4. Relaciones de Subasta (Foreign Keys)
  id_puja_mas_alta: number | null;
  id_ganador: number | null;

  // 5. Campos de Control (Críticos según tu modelo)
  intentos_fallidos_pago: number; // defaultValue: 0
  excedente_visualizacion: number; // defaultValue: 0, DECIMAL

  // 6. Ubicación Geográfica (Nuevos campos)
  latitud: number | null;  // DECIMAL(10, 8)
  longitud: number | null; // DECIMAL(11, 8)

  // 7. Timestamps PERSONALIZADOS
  // ⚠️ Alineados a tu configuración: createdAt: "fecha_creacion"
  fecha_creacion: string;
  fecha_actualizacion: string;

  // =====================================
  // Relaciones (Includes opcionales)
  // =====================================
  imagenes?: ImagenDto[];
  proyecto?: ProyectoMinimalDto;
  ganador?: UsuarioMinimalDto;
  pujas?: any[]; // Opcional si incluyes historial
}

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

/**
 * DTO para Crear Lote
 * Solo incluye lo necesario para el INSERT inicial
 */
export interface CreateLoteDto {
  id_proyecto?: number | null;
  nombre_lote: string;
  precio_base: number;
  
  // Opcionales (Tienen default en BD o son nullables)
  estado_subasta?: EstadoSubasta;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  
  // Ubicación
  latitud?: number | null;
  longitud?: number | null;
}

/**
 * DTO para Actualizar Lote
 */
export interface UpdateLoteDto extends Partial<CreateLoteDto> {
  // Campos administrativos que no se suelen enviar al crear, pero sí al editar
  activo?: boolean;
  
  // Para control manual del administrador
  id_ganador?: number | null;
  id_puja_mas_alta?: number | null;
  intentos_fallidos_pago?: number;
  excedente_visualizacion?: number;
}

// ==========================================
// 🧩 DTOs AUXILIARES
// ==========================================

export interface ProyectoMinimalDto {
  id: number;
  nombre_proyecto: string;
  descripcion?: string;
}

export interface UsuarioMinimalDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nombre_usuario?: string;
}

/**
 * Respuestas específicas de las acciones de subasta
 */
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
