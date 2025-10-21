// src/application/services/AuthService.ts


import { AuthRepository, LoginResponseDto, LoginWebRequest } from "@/infrastructure/repositories/AuthRepository";
import { ServiceResponse } from "@/shared/types/service-response";

export interface IAuthService {
  loginWeb(req: LoginWebRequest): Promise<ServiceResponse<LoginResponseDto>>;
}

export class AuthService implements IAuthService {
  constructor(private repo = new AuthRepository()) {}

  loginWeb(req: LoginWebRequest) {
    return this.repo.loginWeb(req);
  }
}
