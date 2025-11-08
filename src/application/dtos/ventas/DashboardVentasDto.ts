export interface DashboardVentasRequest {
  /** usuarioNombre que viaja en el JWT / LS */
  usuarioNombre: string;
  /** Puede ser Date o ISO string; el repo hará la conversión */
  desde?: Date | string | null;
  hasta?: Date | string | null;
  page?: number;
  pageSize?: number;
  search?: string;
  idNegocio?: number;
}

export interface VentaRowDto {
  folio: string;
  articulo: string;
  descripcion: string;
  monto: number;
  puntosGenerados: number;
  creadoFecha: string; // ISO en el back; aquí lo tratamos como string
  cobrado: number;
}

export interface SerieDiaDto {
  /** ISO-like: "2025-10-27" si lo serializas; del back llega como DateOnly */
  dia: string | any;
  ventas: number;
}

export interface TopArticuloDto {
  nombre: string;
  cantidad: number;
}

export interface DashboardVentasResponse {
  rows: VentaRowDto[];
  totalRows: number;

  totalVentas: number;
  totalCobrado: number;
  puntosGenerados: number;
  ticketPromedio: number;

  ventasPorDia: SerieDiaDto[];
  topArticulos: TopArticuloDto[];
}

export interface DashboardVentasCustomRequest {
  /** Id del negocio */
  idNegocio: number;

  /** Rango de fechas opcional (el back usará DateTime? en C#) */
  desde?: Date | string | null;
  hasta?: Date | string | null;
}

/** Punto (día) de una serie de producto personalizado */
export interface DashboardVentasCustomPoint {
  /** Fecha del día (sin hora, ISO o tipo Date) */
  fecha: string | any;
  /** Número de ventas del día */
  ventas: number;
  /** Monto total cobrado en esas ventas */
  monto: number;
  /** Número de canjes realizados en ese día */
  canjes: number;
}

/** Serie agrupada por producto personalizado */
export interface DashboardVentasCustomSeries {
  /** Id del producto personalizado */
  idProductoCustom: number;
  /** Nombre del producto personalizado */
  nombreProducto: string;
  /** Puntos de datos diarios */
  data: DashboardVentasCustomPoint[];
}

/** Respuesta general del dashboard de promociones personalizadas */
export interface DashboardVentasCustomResponse {
  /** Lista de series (una por producto personalizado) */
  series: DashboardVentasCustomSeries[];
}