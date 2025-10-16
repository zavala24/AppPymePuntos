import { api, apiPublic } from "../http/api";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { CreateNegocioDto } from "@/application/dtos/negocio/CreateNegocioDto";
import { ServiceResponse } from "@/shared/types/service-response";

export class NegocioRepository implements INegocioRepository {
  private base = "/Negocio";

  async create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>> {
    const { data } = await apiPublic.post<ServiceResponse<CreateNegocioDto>>(
      `${this.base}/CreateNegocio`,
      dto
    );
    return data;
  }
}
