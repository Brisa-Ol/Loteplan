// Define los campos que se pueden enviar para actualizar una Imagen
export interface IUpdateImagenDTO {
  descripcion?: string;
  id_proyecto?: number | null;
  id_lote?: number | null;
}