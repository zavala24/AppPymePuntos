import { ServiceResponse } from "@/shared/types/service-response";
import { CreateNegocioDto } from "../dtos/negocio/CreateNegocioDto";
import { NegocioDto } from "../dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";


export interface INegocioService {
  create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>>;
    getPaged(
    page: number,
    pageSize: number,
    search?: string | null,
    category?: string | null
  ): Promise<ServiceResponse<PagedResult<NegocioDto>>>;
}