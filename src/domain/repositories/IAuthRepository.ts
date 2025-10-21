import { LoginResponseDto, LoginWebRequest } from "@/infrastructure/repositories/AuthRepository";
import { ServiceResponse } from "@/shared/types/service-response";

export interface IAuthRepository {
  loginWeb(body: LoginWebRequest): Promise<ServiceResponse<LoginResponseDto>>;
}