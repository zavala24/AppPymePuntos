import { api } from "../http/api";
import { ServiceResponse } from "@/shared/types/service-response";
import { NotificacionDto } from "@/application/dtos/notificaciones/NotificacionDto";
import { SendNotificacionDto } from "@/application/dtos/notificaciones/SendNotificacionDto";
import { INotificacionRepository } from "@/domain/repositories/INotificacionRepository";

export class NotificacionRepository implements INotificacionRepository {
  async getByUsuario(usuario: string): Promise<ServiceResponse<NotificacionDto[]>> {
    const { data } = await api.get<ServiceResponse<NotificacionDto[]>>(
      "/Notificaciones/GetNotificacionesByNegocio",
      { params: { usuario } }
    );
    return data;
  }

  async sendNotification(dto: SendNotificacionDto): Promise<ServiceResponse<boolean>> {
    const { data } = await api.post<ServiceResponse<boolean>>(
      `/Notificaciones/EnviarNotificaciones`,
      dto
    );
    return data;
  }
}
