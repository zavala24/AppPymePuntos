
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import type { UserAdminDto } from "@/application/dtos/usuario/UserAdminDto";
import { api, apiPublic } from "../http/api";
import { ServiceResponse } from "@/shared/types/service-response";
import { PagedResult } from "@/shared/types/PagedResult";
import { UsuarioPorNegocioDto } from "@/application/dtos/usuario/UsuarioPorNegocioDto";
import { UpsertUsuarioDeNegocioDto } from "@/application/dtos/usuario/UpsertUsuarioDeNegocioDto";

export class UserRepository {
  private base = "/User";

  async getAdminsPaged(page: number, pageSize: number, search?: string | null) {
    const { data } = await api.get<ServiceResponse<PagedResult<UserAdminDto>>>(
      `${this.base}/GetAdminsPaged`,
      { params: { page, pageSize, search: search ?? null } }
    );
    return data;
  }

  async createOrUpdateAdmin(dto: CreateUpdateUserAdminDto) {
    const { data } = await api.post<ServiceResponse<CreateUpdateUserAdminDto>>(
      `${this.base}/CreateUpdateUserAdmin`,
      dto
    );
    return data;
  }

  async GetUsuariosByNegocio(idNegocio: number): Promise<ServiceResponse<UsuarioPorNegocioDto[]>> {
    const { data } = await api.get<ServiceResponse<UsuarioPorNegocioDto[]>>(
      `${this.base}/GetUsuariosByNegocio`,
      { params: { idNegocio } }
    );
    return data;
  }

  async upsertUsuarioDeNegocio(dto: UpsertUsuarioDeNegocioDto): Promise<ServiceResponse<boolean>> {
    const { data } = await api.post<ServiceResponse<boolean>>(
      `${this.base}/UpsertUsuarioDeNegocio`, dto
    );
    return data;
  }

    async deleteUsuarioDeNegocio(idUsuario: number, idNegocio: number) {
    const { data } = await api.delete<ServiceResponse<boolean>>(
      `${this.base}/DeleteUsuarioByNegocio`,
      { params: { idUsuario, idNegocio } }
    );
    return data;
  }
}
