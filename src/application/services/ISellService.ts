import { ServiceResponse } from "@/shared/types/service-response";
import {

} from "@/domain/repositories/ISellRepository";
import { DashboardVentasRequest, DashboardVentasResponse } from "../dtos/ventas/DashboardVentasDto";

export interface ISellService {
  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>>;
}