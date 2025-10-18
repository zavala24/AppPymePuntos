import { api, apiPublic } from "../http/api";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { CreateNegocioDto } from "@/application/dtos/negocio/CreateNegocioDto";
import { ServiceResponse } from "@/shared/types/service-response";
import { NegocioDto } from "@/application/dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";

export class NegocioRepository implements INegocioRepository {
  private base = "/Negocio";

  async create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>> {
    const { data } = await apiPublic.post<ServiceResponse<CreateNegocioDto>>(
      `${this.base}/CreateNegocio`,
      dto
    );
    return data;
  }

    async getPaged(
    page: number,
    pageSize: number,
    search?: string | null,
    category?: string | null
  ): Promise<ServiceResponse<PagedResult<NegocioDto>>> {
    const { data } = await apiPublic.get<ServiceResponse<PagedResult<NegocioDto>>>(
      `${this.base}/GetNegociosPaged`,
      { params: { page, pageSize, search, category } }
    );
    return data;
  }
}
