// src/application/interfaces/ISellService.ts
import { ServiceResponse } from "@/shared/types/service-response";
import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";
import { UpdateVentaFromRowDto } from "../dtos/ventas/UpdateVentaFromRowDto ";
import { DeleteVentaFromRowDto } from "../dtos/ventas/DeleteVentaFromRowDto";



export interface ISellService {
  getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>>;

  /** NUEVO: dashboard de promociones personalizadas */
  getVentasCustomDashboard(
    req: DashboardVentasCustomRequest
  ): Promise<ServiceResponse<DashboardVentasCustomResponse>>;

  updateVentaFromRow(dto: UpdateVentaFromRowDto): Promise<ServiceResponse<VentaRowDto>>;

    deleteVentaFromRow(
    dto: DeleteVentaFromRowDto
  ): Promise<ServiceResponse<boolean>>;
}
