// Archivo: src/types/suscripcionCancelada.dto.ts

import type { SuscripcionProyectoDto } from './suscripcionProyecto.dto';


export interface ISuscripcionCancelada {
  id: number;
  id_suscripcion_original: number;
  id_usuario: number;
  id_proyecto: number;
  meses_pagados: number;
  monto_pagado_total: string; // DECIMAL se maneja como string
  fecha_cancelacion: string;   // DATE se maneja como string ISO
  createdAt: string;
  updatedAt: string;
  

}


export interface CancelarSuscripcionResponse {
  message: string;
  suscripcion: SuscripcionProyectoDto; // Devuelve la suscripción original, ahora inactiva
}