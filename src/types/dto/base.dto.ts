export interface BaseDTO {
  id: number;
  activo: boolean;
  
  // Sequelize casi siempre añade esto, es bueno tenerlos:
  createdAt?: string; 
  updatedAt?: string;
}