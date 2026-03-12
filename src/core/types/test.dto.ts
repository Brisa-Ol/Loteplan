

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Respuesta de la simulación de impago.
 */
export interface SimularImpagoResponseDto {
  message: string;
  puja_vencida_id: number;
  // Puedes agregar otros campos si tu controlador los devuelve en el futuro
}