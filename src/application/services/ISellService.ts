// src/application/interfaces/ISellService.ts
import { ServiceResponse } from "@/shared/types/service-response";
import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
} from "@/application/dtos/ventas/DashboardVentasDto";



export interface ISellService {
  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>>;

  /** NUEVO: dashboard de promociones personalizadas */
  getVentasCustomDashboard(
    req: DashboardVentasCustomRequest
  ): Promise<ServiceResponse<DashboardVentasCustomResponse>>;
}
