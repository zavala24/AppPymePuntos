import type { INegocioService } from "./INegocioService";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { CreateNegocioDto } from "../dtos/negocio/CreateNegocioDto";
import { ServiceResponse } from "@/shared/types/service-response";

export class NegocioService implements INegocioService {
  constructor(private repo: INegocioRepository) {}

  async create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>> {
    return this.repo.create(dto);
  }
}
