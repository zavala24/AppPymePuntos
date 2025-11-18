import { IProductosCustomService } from "./IProductosCustomService";
import { IProductosCustomRepository } from "@/domain/repositories/IProductosCustomRepository";
import { ServiceResponse } from "@/shared/types/service-response";
import {
  ProductoCustomDto,
  UpsertProductoCustomRequest,
  ProgresoClienteCustomDto,
  ProgresoCustomRequest,
} from "@/application/dtos/productos-custom/ProductoCustomDtos";

export class ProductosCustomService implements IProductosCustomService {
  constructor(private repo: IProductosCustomRepository) {}

  GetProductosCustomByUsuario(usuario: string): Promise<ServiceResponse<ProductoCustomDto[]>> {
    return this.repo.GetProductosCustomByUsuario(usuario);
  }

  upsertProductoCustom(req: UpsertProductoCustomRequest): Promise<ServiceResponse<ProductoCustomDto>> {
    return this.repo.upsertProductoCustom(req);
  }

  // Android
  acumularProgresoCustom(req: ProgresoCustomRequest): Promise<ServiceResponse<ProgresoClienteCustomDto>> {
    return this.repo.acumularProgresoCustom(req);
  }

  // Android
  canjearProgresoCustom(req: ProgresoCustomRequest): Promise<ServiceResponse<ProgresoClienteCustomDto>> {
    return this.repo.canjearProgresoCustom(req);
  }

    deleteProductoCustom(idProductoCustom: number): Promise<ServiceResponse<boolean>> {
    return this.repo.deleteProductoCustom(idProductoCustom);
  }
}
