export type ProductoCustomDto = {
  idProductoCustom: number;
  idNegocio: number;
  nombreProducto: string;
  descripcion?: string | null;
  meta: number;
  porcentajePorCompra: number;
  tipoAcumulacion: string;
  recompensa?: string | null;
  estado: boolean;
  creadoPor?: string | null;
  creadoFecha?: string | null;
  actualizadoPor?: string | null;
  actualizadoFecha?: string | null;
  fechaCaducidad?: string | null;
};

export type UpsertProductoCustomRequest = {
  usuario: string;
  usuarioOperacion?: string | null;
  idProductoCustom?: number | null; // si viene => update
  nombreProducto: string;
  descripcion?: string | null;
  meta: number;
  porcentajePorCompra: number; // 0..100
  tipoAcumulacion: string;     // "Compra" | "Monto" | "Cantidad"
  recompensa?: string | null;
  estado: boolean;
};

export type ProgresoClienteCustomDto = {
  idProgreso: number;
  idNegocio: number;
  idProductoCustom: number;
  nombreProducto: string;
  telefonoCliente: string;
  porcentajeActual: number; // 0..100
  estado: "Activo" | "Canjeable" | "Canjeado";
  ultimaActualizacion?: string | null;
  canjeFecha?: string | null;
  canjeadoPor?: string | null;
};

export type ProgresoCustomRequest = {
  usuario: string;          // para resolver negocio
  idProductoCustom: number;
  telefonoCliente: string;
  operador?: string | null; // quien registra en Android
};
