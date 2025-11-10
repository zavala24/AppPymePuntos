export interface CreateUpdateUserAdminDto {
  idUsuario: number;           
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null;
  telefono: string;
  usuarioNombre: string;
  idNegocio: number;
  isAdmin: boolean;
  activo: boolean;             
  passwordNueva?: string | null;
}