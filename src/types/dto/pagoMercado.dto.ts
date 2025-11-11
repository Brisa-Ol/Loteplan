/**
 * Define los métodos de pasarela (ejemplo).
 */
export type MetodoPasarela = 'mercadopago' | 'stripe' | string;

/**
 * Define los estados posibles para un pago en la pasarela,
 * basado en el ENUM del modelo de Sequelize.
 */
export type PagoMercadoEstado = 
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'devuelto'
  | 'en_proceso';

/**
 * DTO para el modelo PagoMercado.
 * Representa la información *segura* de la pasarela de pago que se envía al frontend.
 *
 * NOTA: Este modelo NO extiendes 'BaseDTO'.
 */
export interface PagoMercadoDTO {
  id: number;
  id_transaccion: number;
  id_transaccion_pasarela: string | null;
  
  // DataTypes.DECIMAL se mapea a number
  monto_pagado: number;
  
  metodo_pasarela: MetodoPasarela;
  tipo_medio_pago: string | null;
  
  // DataTypes.ENUM se mapea a nuestro tipo de unión literal
  estado: PagoMercadoEstado;

  // DataTypes.DATE se mapea a string (ISO 8601)
  fecha_aprobacion: string | null;

  // Timestamps estándar (createdAt/updatedAt) porque 'timestamps: true'
  createdAt?: string;
  updatedAt?: string;

  // IMPORTANTE: El campo 'detalles_raw' (JSON) se OMITE intencionalmente
  // de este DTO, ya que no debe ser expuesto al frontend.
}