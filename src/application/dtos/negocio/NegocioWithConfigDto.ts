export type NegocioWithConfigDto = {
  idNegocio: number;
  nombreNegocio: string;
  categoria: string | null;
  direccion: string | null;
  facebook: string | null;
  instagram: string | null;
  sitioWeb: string | null;
  esActivo: boolean;

  idConfiguracionNegocio: number | null;
  porcentajeVentas: number | null;
  urlLogo: string | null;
};