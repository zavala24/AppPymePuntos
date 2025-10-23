import { api, apiPublic } from "../http/api";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { ServiceResponse } from "@/shared/types/service-response";
import { NegocioDto } from "@/application/dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { CreateUpdateNegocioDto } from "@/application/dtos/negocio/CreateUpdateNegocioDto";
import { CreateUpdateNegocioConfigDto } from "@/application/dtos/negocio/CreateUpdateNegocioConfigDto";
import { NegocioConfigDto } from "@/application/dtos/negocio/NegocioConfigDto";

export class NegocioRepository implements INegocioRepository {
  private base = "/Negocio";

  async createOrUpdate(dto: CreateUpdateNegocioDto): Promise<ServiceResponse<CreateUpdateNegocioDto>> {
    const { data } = await api.post<ServiceResponse<CreateUpdateNegocioDto>>(
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
    const { data } = await api.get<ServiceResponse<PagedResult<NegocioDto>>>(
      `${this.base}/GetNegociosPaged`,
      { params: { page, pageSize, search, category } }
    );
    return data;
  }

    async createOrUpdateConfigBusiness(
    dto: CreateUpdateNegocioConfigDto
  ): Promise<ServiceResponse<boolean>> {
    const { data } = await api.post<ServiceResponse<boolean>>(
      `${this.base}/CreateUpdateConfigBusiness`,
      dto
    );
    return data;
  }

  async getConfigsPaged(
    page: number,
    pageSize: number,
    search?: string | null
  ): Promise<ServiceResponse<PagedResult<NegocioConfigDto>>> {
    const { data } = await api.get<ServiceResponse<PagedResult<NegocioConfigDto>>>(
      `${this.base}/GetNegociosConfigsPaged`,
      { params: { page, pageSize, search } }
    );
    return data;
  }
}
