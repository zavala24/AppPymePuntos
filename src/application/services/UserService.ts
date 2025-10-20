import type { IUserService } from "./IUserService";
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";

export class UserService implements IUserService {
  constructor(private repo: UserRepository) {}

  getAdminsPaged(page: number, pageSize: number, search?: string | null) {
    return this.repo.getAdminsPaged(page, pageSize, search);
  }

  createOrUpdateAdmin(dto: CreateUpdateUserAdminDto) {
    return this.repo.createOrUpdateAdmin(dto);
  }
}
