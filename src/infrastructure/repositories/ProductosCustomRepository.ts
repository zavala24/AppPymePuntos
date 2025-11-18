import { api } from "../http/api";
import { ServiceResponse } from "@/shared/types/service-response";

import {
  ProductoCustomDto,
  UpsertProductoCustomRequest,
  ProgresoClienteCustomDto,
  ProgresoCustomRequest,
} from "@/application/dtos/productos-custom/ProductoCustomDtos";
import { IProductosCustomRepository } from "@/domain/repositories/IProductosCustomRepository";

export class ProductosCustomRepository implements IProductosCustomRepository {
  private base = "/ProductosCustom";

  async GetProductosCustomByUsuario(usuario: string): Promise<ServiceResponse<ProductoCustomDto[]>> {
    const { data } = await api.get<ServiceResponse<ProductoCustomDto[]>>(
      `${this.base}/GetProductosCustomByUsuario`,
      { params: { usuario } }
    );
    return data;
  }

  async upsertProductoCustom(req: UpsertProductoCustomRequest): Promise<ServiceResponse<ProductoCustomDto>> {
    const { data } = await api.post<ServiceResponse<ProductoCustomDto>>(
      `${this.base}/UpsertProductoCustom`,
      req
    );
    return data;
  }

  // Android
  async acumularProgresoCustom(req: ProgresoCustomRequest): Promise<ServiceResponse<ProgresoClienteCustomDto>> {
    const { data } = await api.post<ServiceResponse<ProgresoClienteCustomDto>>(
      `${this.base}/AcumularProgresoCustom`,
      req
    );
    return data;
  }

  // Android
  async canjearProgresoCustom(req: ProgresoCustomRequest): Promise<ServiceResponse<ProgresoClienteCustomDto>> {
    const { data } = await api.post<ServiceResponse<ProgresoClienteCustomDto>>(
      `${this.base}/CanjearProgresoCustom`,
      req
    );
    return data;
  }

  async deleteProductoCustom(idProductoCustom: number): Promise<ServiceResponse<boolean>> {
    const { data } = await api.delete<ServiceResponse<boolean>>(
      `${this.base}/DeleteProductoCustom`,
      { params: { idProductoCustom } }
    );
    return data;
  }
}
