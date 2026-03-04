export interface BaseDTO {
  id: number;
  activo: boolean;
  
  // Sincronizado con el JSON real del backend
  createdAt?: string; 
  updatedAt?: string; 
}