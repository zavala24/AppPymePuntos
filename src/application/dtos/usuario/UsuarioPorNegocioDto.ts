export interface UsuarioPorNegocioDto {
  idUsuario: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string | null;
  telefono?: string | null;
  usuarioNombre: string;
  fechaRegistro: string; 
  activo: boolean;
  isAdmin: boolean;      
}