export interface CreateUpdateNegocioConfigDto {
  idConfiguracionNegocio?: number;
  idNegocio: number;
  usuarioNombre: string;
  porcentajeVentas: number;
  urlLogo?: string | null;
}