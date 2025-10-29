export interface DashboardVentasRequest {
  /** usuarioNombre que viaja en el JWT / LS */
  usuarioNombre: string;
  /** Puede ser Date o ISO string; el repo hará la conversión */
  desde?: Date | string | null;
  hasta?: Date | string | null;
  page?: number;
  pageSize?: number;
  search?: string;
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