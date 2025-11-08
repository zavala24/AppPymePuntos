// src/domain/repositories/ISellRepository.ts
import { ServiceResponse } from "@/shared/types/service-response";
import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
} from "@/application/dtos/ventas/DashboardVentasDto";



export interface ISellRepository {
  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>>;

  /** NUEVO: dashboard de promociones personalizadas */
  getVentasCustomDashboard(
    req: DashboardVentasCustomRequest
  ): Promise<ServiceResponse<DashboardVentasCustomResponse>>;
}
