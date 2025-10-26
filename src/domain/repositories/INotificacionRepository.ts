import { ServiceResponse } from "@/shared/types/service-response";
import { SendNotificacionDto } from "@/application/dtos/notificaciones/SendNotificacionDto";
import { NotificacionDto } from "@/application/dtos/notificaciones/NotificacionDto";

export interface INotificacionRepository {
  /** GET: /Notificacion/GetNotificacionesByNegocio?idNegocio=... */
  getByUsuario(usuario: string): Promise<ServiceResponse<NotificacionDto[]>>;

  /** POST: /EnviarNotificaciones */
  sendNotification(dto: SendNotificacionDto): Promise<ServiceResponse<boolean>>;
}
