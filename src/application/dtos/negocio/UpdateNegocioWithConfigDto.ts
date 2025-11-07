export type UpdateNegocioWithConfigDto = {
  idNegocio: number;
  usuarioNombre: string;
  nombre?: string | null;
  categoria?: string | null;
  direccion?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;
  esActivo?: boolean | null;

  porcentajeVentas?: number | null;
  urlLogo?: string | null;
  permitirConfiguracionPersonalizada?: boolean | null;
};