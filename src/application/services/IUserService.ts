
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import type { UserAdminDto } from "@/application/dtos/usuario/UserAdminDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { ServiceResponse } from "@/shared/types/service-response";
import { UsuarioPorNegocioDto } from "../dtos/usuario/UsuarioPorNegocioDto";
import { UpsertUsuarioDeNegocioDto } from "../dtos/usuario/UpsertUsuarioDeNegocioDto";

export interface IUserService {
  getAdminsPaged(page: number, pageSize: number, search?: string | null): Promise<ServiceResponse<PagedResult<UserAdminDto>>>;
  createOrUpdateAdmin(dto: CreateUpdateUserAdminDto): Promise<ServiceResponse<CreateUpdateUserAdminDto>>;
  GetUsuariosByNegocio(idNegocio: number): Promise<ServiceResponse<UsuarioPorNegocioDto[]>>;

  /** Crea o actualiza un usuario y lo liga al negocio (Role=2, IsAdmin=false) */
  upsertUsuarioDeNegocio(dto: UpsertUsuarioDeNegocioDto): Promise<ServiceResponse<boolean>>;
}
