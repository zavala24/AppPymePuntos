import type { IUserService } from "./IUserService";
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { UsuarioPorNegocioDto } from "../dtos/usuario/UsuarioPorNegocioDto";
import { ServiceResponse } from "@/shared/types/service-response";
import { UpsertUsuarioDeNegocioDto } from "../dtos/usuario/UpsertUsuarioDeNegocioDto";

export class UserService implements IUserService {
  constructor(private repo: UserRepository) {}

  getAdminsPaged(page: number, pageSize: number, search?: string | null) {
    return this.repo.getAdminsPaged(page, pageSize, search);
  }

  createOrUpdateAdmin(dto: CreateUpdateUserAdminDto) {
    return this.repo.createOrUpdateAdmin(dto);
  }

    GetUsuariosByNegocio(idNegocio: number): Promise<ServiceResponse<UsuarioPorNegocioDto[]>> {
    return this.repo.GetUsuariosByNegocio(idNegocio);
  }

  /** Crear o actualizar usuario de negocio */
  upsertUsuarioDeNegocio(dto: UpsertUsuarioDeNegocioDto): Promise<ServiceResponse<boolean>> {
    return this.repo.upsertUsuarioDeNegocio(dto);
  }
}
