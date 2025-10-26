import { ServiceResponse } from "@/shared/types/service-response";
import type { INotificacionService } from "./INotificacionService";
import { NotificacionRepository } from "@/infrastructure/repositories/NotificacionRepository";
import { NotificacionDto } from "../dtos/notificaciones/NotificacionDto";
import { SendNotificacionDto } from "../dtos/notificaciones/SendNotificacionDto";

export class NotificacionService implements INotificacionService {
  constructor(private repo: NotificacionRepository) {}

  getByUsuario(usuario: string): Promise<ServiceResponse<NotificacionDto[]>> {
    return this.repo.getByUsuario(usuario);
  }
  sendNotification(dto: SendNotificacionDto): Promise<ServiceResponse<boolean>> {
    return this.repo.sendNotification(dto);
  }
}
