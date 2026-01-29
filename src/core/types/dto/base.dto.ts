export interface BaseDTO {
  id: number;
  activo: boolean;
  
  // Sequelize casi siempre añade esto, es bueno tenerlos:
  fecha_creacion: string;     // createdAt
  fecha_actualizacion: string; // updatedAt
}