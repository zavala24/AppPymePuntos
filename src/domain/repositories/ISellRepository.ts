import { DashboardVentasRequest, DashboardVentasResponse } from "@/application/dtos/ventas/DashboardVentasDto";
import { ServiceResponse } from "@/shared/types/service-response";

export interface ISellRepository {
  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>>;
}