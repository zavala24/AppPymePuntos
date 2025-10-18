import * as React from "react";
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack,
  FormControlLabel, Switch, Divider, Autocomplete, CircularProgress
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/HighlightOff";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

// Negocios (para el dropdown con buscador)
import { NegocioRepository } from "@/infrastructure/repositories/NegocioRepository";
import { NegocioService } from "@/application/services/NegocioService";
import type { INegocioService } from "@/application/services/INegocioService";
import type { NegocioDto } from "@/application/dtos/NegocioDto";

const negocioService: INegocioService = new NegocioService(new NegocioRepository());

/** ====== Tipos locales ====== */
interface AdminRow {
  id: number;
  nombreCompleto: string;
  usuario: string;
  email: string;
  telefono: string;
  negocio: string;
  admin: boolean;
}

export default function ConfigUsuariosAdminPage() {
  // ------- Formulario -------
  const [form, setForm] = React.useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    telefono: "",
    usuario: "",
    esAdmin: true,              // por defecto TRUE
    idNegocio: null as number | null,
    negocioNombre: "",
  });

  const [editingId, setEditingId] = React.useState<number | null>(null);
  const isEditing = editingId != null && editingId > 0;

  // ------- Dropdown Negocios (con buscador + fetch remoto) -------
  const [negQuery, setNegQuery] = React.useState("");
  const [negOptions, setNegOptions] = React.useState<NegocioDto[]>([]);
  const [negLoading, setNegLoading] = React.useState(false);

  const fetchNegocios = React.useCallback(async (term: string) => {
    try {
      setNegLoading(true);
      const resp = await negocioService.getPaged(1, 10, term || null);
      setNegOptions(resp.status === 200 && resp.data ? resp.data.items : []);
    } finally {
      setNegLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => fetchNegocios(negQuery), 400); // debounce
    return () => clearTimeout(t);
  }, [negQuery, fetchNegocios]);

  // ------- Grid (maqueta) -------
  const [rows, setRows] = React.useState<AdminRow[]>([]); // sin datos por ahora
  const [rowCount] = React.useState(0);
  const [loading] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState("");

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const columns: GridColDef<AdminRow>[] = [
    {
      field: "nombreCompleto",
      headerName: "Nombre",
      flex: 1.2,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={600}>{p.value as string}</Typography>
          {p.row.admin && <CheckIcon fontSize="small" color="success" />}
        </Stack>
      ),
    },
    { field: "usuario", headerName: "Usuario", flex: 0.8 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "telefono", headerName: "Teléfono", flex: 0.7 },
    { field: "negocio", headerName: "Negocio", flex: 1 },
    {
      field: "admin",
      headerName: "Admin",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (p.value ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />),
    },
  ];

  // altura dinámica como en Negocios
  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  // ------- Acciones básicas de maqueta -------
  const clearForm = () =>
    setForm({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      telefono: "",
      usuario: "",
      esAdmin: true,
      idNegocio: null,
      negocioNombre: "",
    });

  const onNuevo = () => {
    setEditingId(null);
    clearForm();
  };

  const onCancelarEdicion = () => {
    setEditingId(null);
    clearForm();
  };

  // El botón Guardar por ahora no consume API (maqueta)
  const onGuardar = () => {
    // Aquí luego llamarás a tu AdminUserService.createOrUpdate
    console.log("Form a guardar (maqueta):", form, { editingId });
  };

  return (
    <Box className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4">
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" color="primary">Usuarios administrativos</Typography>
        <Chip icon={<ShieldIcon />} label="Solo SUPER ADMIN" color="secondary" variant="outlined" />
      </Stack>

      {/* Formulario */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {isEditing ? "Editar usuario" : "Nuevo usuario"}
        </Typography>

        {/* Nombres */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Apellido paterno *"
            value={form.apellidoPaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoPaterno: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Apellido materno"
            value={form.apellidoMaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoMaterno: e.target.value }))}
          />
        </Stack>

        {/* Contacto / Usuario */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Email *"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Teléfono *"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Usuario *"
            value={form.usuario}
            onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
          />
        </Stack>

        {/* Negocio + Admin */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <Autocomplete
            fullWidth
            options={negOptions}
            loading={negLoading}
            // mostrar SOLO el nombre
            getOptionLabel={(o) => o.nombre}
            // sin filtro local (ya filtramos en servidor)
            filterOptions={(x) => x}
            value={
              form.idNegocio
                ? negOptions.find((n) => n.idNegocio === form.idNegocio) ??
                  ({
                    idNegocio: form.idNegocio,
                    nombre: form.negocioNombre || "",
                    categoria: "",
                    facebook: null, instagram: null, sitioWeb: null, direccion: null, esActivo: true
                  } as unknown as NegocioDto)
                : null
            }
            onChange={(_, val) =>
              setForm((f) => ({
                ...f,
                idNegocio: val ? val.idNegocio : null,
                negocioNombre: val ? val.nombre : "",
              }))
            }
            onInputChange={(_, val) => setNegQuery(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Negocio"
                placeholder="Buscar negocio..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {negLoading ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.esAdmin}
                onChange={(e) => setForm((f) => ({ ...f, esAdmin: e.target.checked }))}
              />
            }
            label="Admin"
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button startIcon={<AddIcon />} variant="outlined" color="primary" onClick={onNuevo}>
            Nuevo
          </Button>
          {isEditing && (
            <Button startIcon={<CancelIcon />} variant="outlined" color="warning" onClick={onCancelarEdicion}>
              Cancelar edición
            </Button>
          )}
          <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={onGuardar}>
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      {/* Buscador + Grid (maqueta) */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>
          Usuarios administrativos
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <TextField
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Buscar usuario..."
          size="small"
          fullWidth
          sx={{
            mb: 3,
            maxWidth: { xs: "100%", md: 720 },
            "& .MuiOutlinedInput-root": { borderRadius: 20, height: 44 },
            "& .MuiOutlinedInput-input": { lineHeight: "44px" },
          }}
        />

        <Box sx={{ height: dynamicHeight, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            paginationMode="client"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50]}
            getRowClassName={(p) => (p.indexRelativeToCurrentPage % 2 === 0 ? "row-even" : "row-odd")}
            slots={{
              noRowsOverlay: () => (
                <Stack height="100%" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">Sin datos</Typography>
                </Stack>
              ),
            }}
            sx={{
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              "& .row-even": { backgroundColor: "#ffffff" },
              "& .row-odd": { backgroundColor: "rgba(14,165,233,0.06)" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,0.12) !important" },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
