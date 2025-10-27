import { ServiceResponse } from "@/shared/types/service-response";
import {

  ISellRepository,
} from "@/domain/repositories/ISellRepository";
import { DashboardVentasRequest, DashboardVentasResponse } from "../dtos/ventas/DashboardVentasDto";

export class SellService {
  constructor(private repo: ISellRepository) {}

  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>> {
    return this.repo.getVentasDashboard(req);
  }
}
