import { CreateNegocioDto } from "@/application/dtos/negocio/CreateNegocioDto";
import { NegocioDto } from "@/application/dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { ServiceResponse } from "@/shared/types/service-response";

export interface INegocioRepository {
  create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>>;
    getPaged(
    page: number,
    pageSize: number,
    search?: string | null,
    category?: string | null
  ): Promise<ServiceResponse<PagedResult<NegocioDto>>>;
}