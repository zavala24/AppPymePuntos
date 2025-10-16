export interface CreateNegocioDto {
  nombre: string;
  categoria?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;  
  direccion?: string | null;
  activo: boolean;
}