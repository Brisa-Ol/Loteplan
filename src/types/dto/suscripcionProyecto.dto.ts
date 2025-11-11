// src/types/dto/suscripcionProyecto.dto.ts
import type { BaseDTO } from './base.dto'; // Usamos 'import type'

/**
 * DTO para el modelo SuscripcionProyecto.
 * Representa la suscripción activa de un usuario a un proyecto,
 * sus tokens de puja y su estado de cuenta.
 */
export interface SuscripcionProyectoDTO extends BaseDTO {
  // --- Atributos de BaseDTO ---
  // id: number;
  // activo: boolean;
  // createdAt?: string;
  // updatedAt?: string;

  // --- Atributos específicos de SuscripcionProyecto ---
  
  // DataTypes.INTEGER (allowNull: false)
  id_usuario: number;
  id_proyecto: number;
  tokens_disponibles: number;
  meses_a_pagar: number;

  // DataTypes.DECIMAL se mapea a number
  saldo_a_favor: number;
  monto_total_pagado: number;
}