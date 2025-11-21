// src/application/services/SellServices.ts
import { ServiceResponse } from "@/shared/types/service-response";
import { ISellRepository } from "@/domain/repositories/ISellRepository";

import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "../dtos/ventas/DashboardVentasDto";
import { UpdateVentaFromRowDto } from "../dtos/ventas/UpdateVentaFromRowDto ";
import { DeleteVentaFromRowDto } from "../dtos/ventas/DeleteVentaFromRowDto";


export class SellService {
  constructor(private repo: ISellRepository) {}

  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>> {
    return this.repo.getVentasDashboard(req);
  }

  /** NUEVO: dashboard de promociones personalizadas */
  getVentasCustomDashboard(
    req: DashboardVentasCustomRequest
  ): Promise<ServiceResponse<DashboardVentasCustomResponse>> {
    return this.repo.getVentasCustomDashboard(req);
  }

    async updateVentaFromRow(dto: UpdateVentaFromRowDto): Promise<ServiceResponse<VentaRowDto>> {
    return this.repo.updateVentaFromRow(dto);
  }

    async deleteVentaFromRow(
    dto: DeleteVentaFromRowDto
  ): Promise<ServiceResponse<boolean>> {
    return this.repo.deleteVentaFromRow(dto);
  }
}
