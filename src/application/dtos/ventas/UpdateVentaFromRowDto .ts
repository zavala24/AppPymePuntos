// Request para actualizar una venta desde el row del dashboard
export interface UpdateVentaFromRowDto {
  folio: number;          // VentaId mostrado como Folio en el grid
  articulo: string;
  descripcion: string;
  monto: number;
  cantidad: number;
  idNegocio: number;
  usuarioNombre: string;  // admin que edita (auditoría)
}
