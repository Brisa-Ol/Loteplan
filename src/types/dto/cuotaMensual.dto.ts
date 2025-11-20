import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================



/**
 * Datos para crear una nueva configuración de cuota.
 * El backend calculará los totales automáticamente.
 */
export interface CreateCuotaMensualDto {
  id_proyecto: number;
  nombre_cemento_cemento?: string; // Opcional
  
  // Valores Base
  valor_cemento_unidades: number; // Cantidad de bolsas/unidades
  valor_cemento: number;          // Precio unitario
  
  // Porcentajes de Configuración
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
}

/**
 * Datos para actualizar una cuota existente.
 * Todos son opcionales porque es un PATCH/PUT parcial.
 * Al enviar cualquiera de estos, el backend recalcula todo.
 */
export interface UpdateCuotaMensualDto {
  nombre_cemento_cemento?: string;
  valor_cemento_unidades?: number;
  valor_cemento?: number;
  porcentaje_plan?: number;
  porcentaje_administrativo?: number;
  porcentaje_iva?: number;
  
  // Opcional: Si se quisiera cambiar el plazo manualmente (aunque usualmente viene del proyecto)
  total_cuotas_proyecto?: number;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Representación completa de la Cuota Mensual con todos sus cálculos.
 * Extiende BaseDTO (id, activo, createdAt, updatedAt).
 */
export interface CuotaMensualDto extends BaseDTO {
  id_proyecto: number;
  nombre_proyecto: string;
  nombre_cemento_cemento?: string;
  
  // --- Valores Base ---
  valor_cemento_unidades: number;
  valor_cemento: number;
  total_cuotas_proyecto: number; // Plazo de inversión
  
  // --- Porcentajes ---
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
  
  // --- 🧮 Valores Calculados (Read Only) ---
  valor_movil: number;              // Unidades * Precio
  total_del_plan: number;           // Valor Móvil * % Plan
  valor_mensual: number;            // Total Plan / Cuotas
  carga_administrativa: number;     // Valor Móvil * % Admin
  iva_carga_administrativa: number; // Carga Admin * % IVA
  
  // 💰 El valor más importante para el usuario final
  valor_mensual_final: number;      
}