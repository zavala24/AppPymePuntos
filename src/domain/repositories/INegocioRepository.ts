
import { CreateUpdateNegocioDto } from "@/application/dtos/negocio/CreateUpdateNegocioDto";
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
}