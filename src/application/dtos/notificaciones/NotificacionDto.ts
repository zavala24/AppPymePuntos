export interface NotificacionDto {
  idNotificacion: number;
  idNegocio: number;
  titulo: string;
  cuerpo: string;
  urlLogo?: string | null;
  creadoPor: string;
  creadoCuando: string; // ISO
}
