export interface UpsertUsuarioDeNegocioDto {
  idUsuario?: number | null;
  idNegocio: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string | null;
  telefono?: string | null;
  usuarioNombre: string;
  activo: boolean;
  password?: string | null;
  usuarioOperacion: string;
}