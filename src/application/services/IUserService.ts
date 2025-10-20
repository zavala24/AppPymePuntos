
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import type { UserAdminDto } from "@/application/dtos/usuario/UserAdminDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { ServiceResponse } from "@/shared/types/service-response";

export interface IUserService {
  getAdminsPaged(page: number, pageSize: number, search?: string | null): Promise<ServiceResponse<PagedResult<UserAdminDto>>>;
  createOrUpdateAdmin(dto: CreateUpdateUserAdminDto): Promise<ServiceResponse<CreateUpdateUserAdminDto>>;
}
