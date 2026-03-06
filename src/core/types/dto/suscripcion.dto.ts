// src/core/types/dto/suscripcion.dto.ts

import type { BaseDTO } from "./base.dto";

export interface SuscripcionDto extends BaseDTO {
  id_usuario: number;
  id_proyecto: number;
  tokens_disponibles: number;
  meses_a_pagar: number;
  saldo_a_favor: string;      // DECIMAL llega como string
  monto_total_pagado: string; // DECIMAL llega como string
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario: string;
  };
  proyectoAsociado?: {
    id: number;
    nombre_proyecto: string;
    estado_proyecto: string;
    plazo_inversion: number;
    obj_suscripciones: number;
    suscripciones_actuales: number;
  };
   createdAt: string;  // Override optional → required
  updatedAt: string;
}

export interface SuscripcionCanceladaDto extends BaseDTO {
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;
  monto_pagado_total: string; // DECIMAL llega como string
  fecha_cancelacion: string;
  
  usuarioCancelador?: {
    nombre: string;
    apellido: string;
    email: string;
    nombre_usuario: string;
  };

  proyectoCancelado?: {
    nombre_proyecto: string;
  };

  // ⬇️ ESTO ES LO QUE FALTA PARA SOLUCIONAR EL ERROR ⬇️
  // Debe ser un objeto, no un número (el ID ya está arriba)
  suscripcionOriginal?: {
    id: number;
    monto_total_pagado: string; // Aquí está la propiedad que buscabas
    activo: boolean;
  };
}