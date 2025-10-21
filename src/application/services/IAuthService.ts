// src/application/services/IAuthService.ts

import { LoginResponseDto, LoginWebRequest } from "@/infrastructure/repositories/AuthRepository";
import { ServiceResponse } from "@/shared/types/service-response";


export interface IAuthService {
  loginWeb(req: LoginWebRequest): Promise<ServiceResponse<LoginResponseDto>>;
}
