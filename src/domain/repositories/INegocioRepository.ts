import { CreateNegocioDto } from "@/application/dtos/negocio/CreateNegocioDto";
import { ServiceResponse } from "@/shared/types/service-response";

export interface INegocioRepository {
  create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>>;
}