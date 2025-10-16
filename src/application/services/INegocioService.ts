import { ServiceResponse } from "@/shared/types/service-response";
import { CreateNegocioDto } from "../dtos/negocio/CreateNegocioDto";


export interface INegocioService {
  create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>>;
}