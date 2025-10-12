import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  IconButton,
  Switch,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

type UserRow = {
  id: number;
  nombre: string;
  telefono: string;
  role: "ADMIN" | "SUPERADMIN" | "USER";
  activo: boolean;
};

const initialRows: UserRow[] = [
  { id: 1, nombre: "Julio Zavala", telefono: "6441565045", role: "SUPERADMIN", activo: true },
  { id: 2, nombre: "Ana Pérez", telefono: "6441112233", role: "ADMIN", activo: true },
  { id: 3, nombre: "Luis López", telefono: "6442223344", role: "USER", activo: false },
];

export default function UsuariosPage() {
  const [rows, setRows] = useState<UserRow[]>(initialRows);

  const toggleActivo = (id: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, activo: !r.activo } : r))
    );
  };

  const handleNuevo = () => {
    // Aquí luego abriremos un Dialog con formulario
    alert("Nuevo usuario (placeholder)");
  };

  const handleEditar = (row: UserRow) => {
    alert(`Editar usuario: ${row.nombre} (placeholder)`);
  };

  const handleEliminar = (row: UserRow) => {
    if (confirm(`¿Eliminar usuario "${row.nombre}"?`)) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const roleColor = (role: UserRow["role"]) =>
    role === "SUPERADMIN" ? "secondary" : role === "ADMIN" ? "primary" : "default";

  return (
    <Box className="space-y-4">
      <Paper className="p-6 border border-blue-100 rounded-2xl shadow-sm">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <div>
            <Typography variant="h5" fontWeight={800} color="primary">
              Usuarios
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              Alta, edición y administración de roles.
            </Typography>
          </div>

          <Button startIcon={<AddIcon />} variant="contained" onClick={handleNuevo}>
            Nuevo usuario
          </Button>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Activo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.telefono}</TableCell>
                <TableCell>
                  <Chip size="small" color={roleColor(row.role)} label={row.role} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.activo}
                    onChange={() => toggleActivo(row.id)}
                    inputProps={{ "aria-label": "activo" }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEditar(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleEliminar(row)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography align="center" color="text.secondary">
                    No hay usuarios.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
