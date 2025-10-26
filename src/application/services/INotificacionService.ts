import { ServiceResponse } from "@/shared/types/service-response";
import { SendNotificacionDto } from "../dtos/notificaciones/SendNotificacionDto";
import { NotificacionDto } from "../dtos/notificaciones/NotificacionDto";

export interface INotificacionService {
  sendNotification(dto: SendNotificacionDto): Promise<ServiceResponse<boolean>>;
  getByUsuario(usuario: string): Promise<ServiceResponse<NotificacionDto[]>>; 
}
