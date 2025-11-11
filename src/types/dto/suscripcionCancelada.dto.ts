// src/types/dto/suscripcionCancelada.dto.ts
import type { BaseDTO } from './base.dto'; // Usamos 'import type'

/**
 * DTO para el modelo SuscripcionCancelada.
 * Representa el registro de una suscripción que fue cancelada,
 * visible en el historial del usuario.
 */
export interface SuscripcionCanceladaDTO extends BaseDTO {
  // --- Atributos de BaseDTO ---
  // id: number;
  // activo: boolean;
  // createdAt?: string;
  // updatedAt?: string;

  // --- Atributos específicos de SuscripcionCancelada ---
  
  // DataTypes.INTEGER (allowNull: false)
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;

  // DataTypes.DECIMAL se mapea a number
  monto_pagado_total: number;

  // DataTypes.DATE se mapea a string (ISO 8601)
  fecha_cancelacion: string;
}