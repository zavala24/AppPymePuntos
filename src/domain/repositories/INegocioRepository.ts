
import { CreateUpdateNegocioConfigDto } from "@/application/dtos/negocio/CreateUpdateNegocioConfigDto";
import { CreateUpdateNegocioDto } from "@/application/dtos/negocio/CreateUpdateNegocioDto";
import { NegocioConfigDto } from "@/application/dtos/negocio/NegocioConfigDto";
import { NegocioWithConfigDto } from "@/application/dtos/negocio/NegocioWithConfigDto";
import { UpdateNegocioWithConfigDto } from "@/application/dtos/negocio/UpdateNegocioWithConfigDto";
import { NegocioDto } from "@/application/dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { ServiceResponse } from "@/shared/types/service-response";

export interface INegocioRepository {
  createOrUpdate(dto: CreateUpdateNegocioDto): Promise<ServiceResponse<CreateUpdateNegocioDto>>;
  
  getPaged(
  page: number,
  pageSize: number,
  search?: string | null,
  category?: string | null
): Promise<ServiceResponse<PagedResult<NegocioDto>>>;

  createOrUpdateConfigBusiness(
    dto: CreateUpdateNegocioConfigDto
  ): Promise<ServiceResponse<boolean>>;

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