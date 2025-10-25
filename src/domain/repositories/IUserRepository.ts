import { ServiceResponse } from "@/shared/types/service-response";
import { UsuarioPorNegocioDto } from "@/application/dtos/usuario/UsuarioPorNegocioDto";
import { UpsertUsuarioDeNegocioDto } from "@/application/dtos/usuario/UpsertUsuarioDeNegocioDto";

export interface IUserRepository {
  /** Obtener todos los usuarios (no paginado) por negocio */
  GetUsuariosByNegocio(idNegocio: number): Promise<ServiceResponse<UsuarioPorNegocioDto[]>>;

  /** Crear o actualizar usuario de negocio */
  upsertUsuarioDeNegocio(dto: UpsertUsuarioDeNegocioDto): Promise<ServiceResponse<boolean>>;
}