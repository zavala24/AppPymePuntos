import type { INegocioService } from "./INegocioService";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { ServiceResponse } from "@/shared/types/service-response";
import { NegocioDto } from "../dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";
import { CreateUpdateNegocioDto } from "../dtos/negocio/CreateUpdateNegocioDto";

export class NegocioService implements INegocioService {
  constructor(private repo: INegocioRepository) {}

  async createOrUpdate(dto: CreateUpdateNegocioDto): Promise<ServiceResponse<CreateUpdateNegocioDto>> {
    return this.repo.createOrUpdate(dto);
  }

  getPaged(
    page: number,
    pageSize: number,
    search?: string | null,
    category?: string | null
  ): Promise<ServiceResponse<PagedResult<NegocioDto>>> {
    return this.repo.getPaged(page, pageSize, search, category);
  }
}
