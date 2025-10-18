import type { INegocioService } from "./INegocioService";
import type { INegocioRepository }
  from "../../domain/repositories/INegocioRepository";
import { CreateNegocioDto } from "../dtos/negocio/CreateNegocioDto";
import { ServiceResponse } from "@/shared/types/service-response";
import { NegocioDto } from "../dtos/NegocioDto";
import { PagedResult } from "@/shared/types/PagedResult";

export class NegocioService implements INegocioService {
  constructor(private repo: INegocioRepository) {}

  async create(dto: CreateNegocioDto): Promise<ServiceResponse<CreateNegocioDto>> {
    return this.repo.create(dto);
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
