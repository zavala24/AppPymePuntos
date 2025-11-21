// src/domain/repositories/ISellRepository.ts
import { ServiceResponse } from "@/shared/types/service-response";
import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";
import { UpdateVentaFromRowRequest } from "@/application/dtos/ventas/UpdateVentaFromRowRequest";
import { DeleteVentaFromRowDto } from "@/application/dtos/ventas/DeleteVentaFromRowDto";



export interface ISellRepository {
  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>>;

  /** NUEVO: dashboard de promociones personalizadas */
  getVentasCustomDashboard(
    req: DashboardVentasCustomRequest
  ): Promise<ServiceResponse<DashboardVentasCustomResponse>>;
  
    updateVentaFromRow(
    req: UpdateVentaFromRowRequest
  ): Promise<ServiceResponse<VentaRowDto>>;

    deleteVentaFromRow(
    req: DeleteVentaFromRowDto
  ): Promise<ServiceResponse<boolean>>;
}
