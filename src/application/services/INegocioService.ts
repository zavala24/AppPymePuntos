import { ServiceResponse } from "@/shared/types/service-response";

import { NegocioDto } from "../dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { CreateUpdateNegocioDto } from "../dtos/negocio/CreateUpdateNegocioDto";
import { CreateUpdateNegocioConfigDto } from "../dtos/negocio/CreateUpdateNegocioConfigDto";
import { NegocioConfigDto } from "../dtos/negocio/NegocioConfigDto";


export interface INegocioService {
  createOrUpdate(dto: CreateUpdateNegocioDto): Promise<ServiceResponse<CreateUpdateNegocioDto>>;

  getPaged(
  page: number,
  pageSize: number,
  search?: string | null,
  category?: string | null
): Promise<ServiceResponse<PagedResult<NegocioDto>>>;

  createOrUpdateConfigBusiness(dto: CreateUpdateNegocioConfigDto): Promise<ServiceResponse<boolean>>;

  getConfigsPaged(
    page: number,
    pageSize: number,
    search?: string | null
  ): Promise<ServiceResponse<PagedResult<NegocioConfigDto>>>;
}