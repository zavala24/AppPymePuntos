
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import type { UserAdminDto } from "@/application/dtos/usuario/UserAdminDto";
import { apiPublic } from "../http/api";
import { ServiceResponse } from "@/shared/types/service-response";
import { PagedResult } from "@/shared/types/PagedResult";

export class UserRepository {
  private base = "/User";

  async getAdminsPaged(page: number, pageSize: number, search?: string | null) {
    const { data } = await apiPublic.get<ServiceResponse<PagedResult<UserAdminDto>>>(
      `${this.base}/GetAdminsPaged`,
      { params: { page, pageSize, search: search ?? null } }
    );
    return data;
  }

  async createOrUpdateAdmin(dto: CreateUpdateUserAdminDto) {
    const { data } = await apiPublic.post<ServiceResponse<CreateUpdateUserAdminDto>>(
      `${this.base}/CreateUpdateUserAdmin`,
      dto
    );
    return data;
  }
}
