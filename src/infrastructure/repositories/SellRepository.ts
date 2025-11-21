// src/infrastructure/repositories/SellRepository.ts
import { api } from "../http/api";
import { ServiceResponse } from "@/shared/types/service-response";
import { ISellRepository } from "@/domain/repositories/ISellRepository";

import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";
import { UpdateVentaFromRowRequest } from "@/application/dtos/ventas/UpdateVentaFromRowRequest";
import { DeleteVentaFromRowDto } from "@/application/dtos/ventas/DeleteVentaFromRowDto";


/** Helper: convierte Date | string | null a ISO string (o undefined) para query */
function toIsoParam(d?: Date | string | null): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  const s = String(d).trim();
  return s.length ? s : undefined;
}

export class SellRepository implements ISellRepository {
  private base = "/Sell";

  async getVentasDashboard(
    req: DashboardVentasRequest
  ): Promise<ServiceResponse<DashboardVentasResponse>> {
    const params: Record<string, any> = {
      usuarioNombre: req.usuarioNombre,
      page: req.page ?? 1,
      pageSize: req.pageSize ?? 10,
    };

    const desdeIso = toIsoParam(req.desde);
    const hastaIso = toIsoParam(req.hasta);
    if (desdeIso) params.desde = desdeIso;
    if (hastaIso) params.hasta = hastaIso;

    if (req.search?.trim()) params.search = req.search.trim();
    if (typeof req.idNegocio === "number" && req.idNegocio > 0) {
      params.idNegocio = req.idNegocio;
    }

    const { data } = await api.get<ServiceResponse<DashboardVentasResponse>>(
      `${this.base}/GetVentasDashboard`,
      { params }
    );
    return data;
  }

  /** Dashboard de promociones personalizadas */
  async getVentasCustomDashboard(
    req: DashboardVentasCustomRequest
  ): Promise<ServiceResponse<DashboardVentasCustomResponse>> {
    const params: Record<string, any> = {
      idNegocio: req.idNegocio,
    };

    const desdeIso = toIsoParam(req.desde);
    const hastaIso = toIsoParam(req.hasta);
    if (desdeIso) params.desde = desdeIso;
    if (hastaIso) params.hasta = hastaIso;

    const { data } =
      await api.get<ServiceResponse<DashboardVentasCustomResponse>>(
        `${this.base}/GetVentasCustomDashboard`,
        { params }
      );
    return data;
  }

  /** NUEVO: Actualiza una venta desde el row seleccionado (admin) */
  async updateVentaFromRow(
    req: UpdateVentaFromRowRequest
  ): Promise<ServiceResponse<VentaRowDto>> {
    const { data } = await api.put<ServiceResponse<VentaRowDto>>(
      `${this.base}/UpdateVentaFromRow`,
      req
    );
    return data;
  }

    async deleteVentaFromRow(
    req: DeleteVentaFromRowDto
  ): Promise<ServiceResponse<boolean>> {
    // El endpoint espera [FromBody], así que el body va en config.data
    const { data } = await api.delete<ServiceResponse<boolean>>(
      `${this.base}/DeleteVentaFromRow`,
      { data: req }
    );
    return data;
  }
}
