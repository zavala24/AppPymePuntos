import { ServiceResponse } from "@/shared/types/service-response";

import { NegocioDto } from "../dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { CreateUpdateNegocioDto } from "../dtos/negocio/CreateUpdateNegocioDto";


export interface INegocioService {
  createOrUpdate(dto: CreateUpdateNegocioDto): Promise<ServiceResponse<CreateUpdateNegocioDto>>;

  getPaged(
  page: number,
  pageSize: number,
  search?: string | null,
  category?: string | null
): Promise<ServiceResponse<PagedResult<NegocioDto>>>;
}