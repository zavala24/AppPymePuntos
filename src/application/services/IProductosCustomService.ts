import { ServiceResponse } from "@/shared/types/service-response";
import {
  ProductoCustomDto,
  UpsertProductoCustomRequest,
  ProgresoClienteCustomDto,
  ProgresoCustomRequest,
} from "@/application/dtos/productos-custom/ProductoCustomDtos";

export interface IProductosCustomService {
  GetProductosCustomByUsuario(usuario: string): Promise<ServiceResponse<ProductoCustomDto[]>>;
  upsertProductoCustom(req: UpsertProductoCustomRequest): Promise<ServiceResponse<ProductoCustomDto>>;
  // Android:
  acumularProgresoCustom(req: ProgresoCustomRequest): Promise<ServiceResponse<ProgresoClienteCustomDto>>;
  canjearProgresoCustom(req: ProgresoCustomRequest): Promise<ServiceResponse<ProgresoClienteCustomDto>>;
  deleteProductoCustom(idProductoCustom: number): Promise<ServiceResponse<boolean>>;
}
