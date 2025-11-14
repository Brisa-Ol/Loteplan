// Define la estructura de un objeto Imagen como viene de la API
export interface IImagen {
  id: number;
  url: string;
  descripcion: string | null;
  id_proyecto: number | null;
  id_lote: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}