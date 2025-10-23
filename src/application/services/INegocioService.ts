import { ServiceResponse } from "@/shared/types/service-response";

import { NegocioDto } from "../dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { CreateUpdateNegocioDto } from "../dtos/negocio/CreateUpdateNegocioDto";
import { CreateUpdateNegocioConfigDto } from "../dtos/negocio/CreateUpdateNegocioConfigDto";
import { NegocioConfigDto } from "../dtos/negocio/NegocioConfigDto";
import { NegocioWithConfigDto } from "../dtos/negocio/NegocioWithConfigDto";
import { UpdateNegocioWithConfigDto } from "../dtos/negocio/UpdateNegocioWithConfigDto";


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

  getWithConfig(idNegocio: number): Promise<ServiceResponse<NegocioWithConfigDto>>;

  updateWithConfig(
    dto: UpdateNegocioWithConfigDto
  ): Promise<ServiceResponse<boolean>>;
}