export interface UserAdminDto {
  idUsuario: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string | null;
  telefono: string;
  usuarioNombre: string;
  idNegocio: number;
  negocioNombre: string;
  isAdmin: boolean;
  activo: boolean;             
  fechaRegistro?: string;
}
