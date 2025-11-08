// src/application/services/SellServices.ts
import { ServiceResponse } from "@/shared/types/service-response";
import { ISellRepository } from "@/domain/repositories/ISellRepository";

import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
} from "../dtos/ventas/DashboardVentasDto";


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
}
