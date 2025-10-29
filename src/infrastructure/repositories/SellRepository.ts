// src/infrastructure/repositories/SellRepository.ts
import { api } from "../http/api";
import { ServiceResponse } from "@/shared/types/service-response";
import { ISellRepository } from "@/domain/repositories/ISellRepository";
import {
  DashboardVentasRequest,
  DashboardVentasResponse,
} from "@/application/dtos/ventas/DashboardVentasDto";

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

    // 👇 NUEVO: enviar el search si viene con valor
    if (req.search && req.search.trim().length > 0) {
      params.search = req.search.trim();
    }

    const { data } = await api.get<ServiceResponse<DashboardVentasResponse>>(
      `${this.base}/GetVentasDashboard`,
      { params }
    );
    return data;
  }
}
