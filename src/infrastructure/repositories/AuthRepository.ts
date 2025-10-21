import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { ServiceResponse } from "@/shared/types/service-response";
import { apiPublic } from "../http/api";


export type LoginWebRequest = {
  userOrEmail: string;  // puede ser usuario o email
  password: string;
};

export type LoginResponseDto = {
  token: string;
  user: string;
  role: string;
  telefono: string;
  idNegocio: number;
  message: string;
};

export class AuthRepository implements IAuthRepository {
  private readonly base = "/Auth";

  async loginWeb(body: LoginWebRequest): Promise<ServiceResponse<LoginResponseDto>> {
    try {
      const { data } = await apiPublic.post<ServiceResponse<LoginResponseDto>>(
        `${this.base}/login-web`,
        body
      );
      return data;
    } catch (error: any) {
      // Centralizado: api.ts ya lanza errores procesados
      return {
        status: 500,
        message: error.message || "Error al iniciar sesión.",
        data: null as any,
      };
    }
  }
}
