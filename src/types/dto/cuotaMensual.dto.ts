
/** DTO para el modelo CuotaMensual. */
export interface CuotaMensualDTO {
  id: number;
  id_proyecto: number;
  nombre_proyecto: string;
  nombre_cemento_cemento?: string | null; // Es opcional (allowNull: true)
  valor_cemento_unidades: number;
  
  // Nota: Los tipos DECIMAL de Sequelize se manejan como 'number' en TypeScript.
  // A veces se usan 'string' si la precisión es crítica y se usa una librería
  // como 'decimal.js', pero 'number' es lo estándar para el transporte.
  valor_cemento: number;
  
  total_cuotas_proyecto: number;
  porcentaje_plan: number;
  porcentaje_administrativo: number;
  porcentaje_iva: number;
  valor_movil: number;
  total_del_plan: number;
  valor_mensual: number;
  carga_administrativa: number;
  iva_carga_administrativa: number;
  valor_mensual_final: number;


  createdAt?: string;
  updatedAt?: string;
}
export interface CreateCuotaMensualDTO {
  id_proyecto: number;
  nombre_proyecto: string;
  nombre_cemento_cemento?: string | null;
  valor_cemento_unidades: number;
  valor_cemento: number;
  porcentaje_plan: number; // o string, dependiendo de tu formulario
  porcentaje_administrativo: number; // o string
  porcentaje_iva: number; // o string
  

}
export type UpdateCuotaMensualDTO = Partial<CreateCuotaMensualDTO>;