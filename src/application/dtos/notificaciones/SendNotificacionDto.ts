export interface SendNotificacionDto {
  usuarioNombre: string;
  titulo: string;
  cuerpo: string;
  urlLogo?: string | null;
  creadoPor: string;
}