export type NegocioConfigDto = {
  idConfiguracionNegocio: number;
  idNegocio: number;
  negocioNombre: string;
  porcentajeVentas: number;
  urlLogo: string | null;
  creadoFecha?: string | null;
  actualizadoFecha?: string | null;
};