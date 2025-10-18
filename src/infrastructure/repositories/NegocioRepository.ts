import { api, apiPublic } from "../http/api";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { ServiceResponse } from "@/shared/types/service-response";
import { NegocioDto } from "@/application/dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { CreateUpdateNegocioDto } from "@/application/dtos/negocio/CreateUpdateNegocioDto";

export class NegocioRepository implements INegocioRepository {
  private base = "/Negocio";

  async createOrUpdate(dto: CreateUpdateNegocioDto): Promise<ServiceResponse<CreateUpdateNegocioDto>> {
    const { data } = await apiPublic.post<ServiceResponse<CreateUpdateNegocioDto>>(
      `${this.base}/CreateUpdateNegocio`,
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
