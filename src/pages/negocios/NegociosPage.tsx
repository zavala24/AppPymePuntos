import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";

// ================= THEME (Material UI) =================
const theme = createTheme({
  palette: {
    primary: { main: "#1E40AF" },    // blue-800
    secondary: { main: "#0EA5E9" },  // sky-500
    success: { main: "#10B981" },    // green-500
    error: { main: "#EF4444" },      // red-500
    background: { default: "#F8FAFC" },
  },
  typography: {
    fontFamily: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial"].join(","),
    h4: { fontWeight: 800 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
  },
});

// ================= TYPES & MOCK =================
interface NegocioRow {
  id: number;
  nombre: string;
  facebook?: string;
  instagram?: string;
  sitio?: string;
  direccion?: string;
  categoria?: string;
  activo: boolean;
}

const initialRows: NegocioRow[] = [
  {
    id: 2,
    nombre: "AMAROK Designs",
    facebook: "facebook.com/AmarokDesigns18",
    instagram: "instagram.com/amarokdesigns18",
    sitio: "",
    direccion: "Valle Encantado #1535",
    categoria: "Diseño Gráfico",
    activo: true,
  },
  {
    id: 1002,
    nombre: "AOBallons and More",
    facebook: "",
    instagram: "",
    sitio: "",
    direccion: "",
    categoria: "Decoraciones",
    activo: true,
  },
  {
    id: 2002,
    nombre: "Geeky Stitches",
    facebook: "facebook.com/share/17R1c...",
    instagram: "instagram.com/geeky-stitches",
    sitio: "geeky-stitches.com",
    direccion: "",
    categoria: "Bordados",
    activo: true,
  },
];

export default function NegociosPage() {
  // ------- Form state -------
  const [form, setForm] = React.useState<Omit<NegocioRow, "id">>({
    nombre: "",
    facebook: "",
    instagram: "",
    sitio: "",
    direccion: "",
    categoria: "",
    activo: true,
  });
  const [rows, setRows] = React.useState<NegocioRow[]>(initialRows);
  const [lastSaved, setLastSaved] = React.useState(form);

  // ------- Actions -------
  const onNuevo = () =>
    setForm({ nombre: "", facebook: "", instagram: "", sitio: "", direccion: "", categoria: "", activo: true });

  const onCancelar = () => setForm(lastSaved);

  const onGuardar = () => {
    if (!form.nombre.trim()) return; // validación mínima
    const newRow: NegocioRow = { id: Math.max(...rows.map((r) => r.id)) + 1, ...form };
    setRows((r) => [newRow, ...r]);
    setLastSaved(form);
    onNuevo(); // reset
  };

  // ------- Grid columns (ID oculto) -------
  const columns: GridColDef<NegocioRow>[] = [
    {
      field: "nombre",
      headerName: "Nombre",
      flex: 1.1,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={600}>{p.value as string}</Typography>
          {p.row.activo && <CheckIcon fontSize="small" color="success" />}
        </Stack>
      ),
    },
    { field: "categoria", headerName: "Categoría", flex: 0.9, valueFormatter: ({ value }) => value || "—" },
    { field: "facebook", headerName: "Facebook", flex: 1, valueFormatter: ({ value }) => value || "—" },
    { field: "instagram", headerName: "Instagram", flex: 1, valueFormatter: ({ value }) => value || "—" },
    { field: "sitio", headerName: "Sitio web", flex: 0.9, valueFormatter: ({ value }) => value || "—" },
    { field: "direccion", headerName: "Dirección", flex: 1.2, valueFormatter: ({ value }) => value || "—" },
    { field: "activo", headerName: "Activo", type: "boolean", width: 110, valueFormatter: ({ value }) => (value ? "Sí" : "No") },
  ];

  // ------- Buscador arriba del grid -------
  const [query, setQuery] = React.useState("");
  const filteredRows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.nombre, r.categoria, r.facebook, r.instagram, r.sitio, r.direccion]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  return (
    <ThemeProvider theme={theme}>
      {/* Contenedor ancho */}
      <Box className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4">
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" color="primary">Negocios</Typography>
          </Box>
          <Chip icon={<ShieldIcon />} label="Solo SUPER ADMIN" color="secondary" variant="outlined" />
        </Stack>

        {/* Formulario */}
        <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre del negocio"
            />
            <TextField
              fullWidth
              label="Facebook"
              value={form.facebook}
              onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
              placeholder="facebook.com/..."
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Instagram"
              value={form.instagram}
              onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
              placeholder="instagram.com/..."
            />
            <TextField
              fullWidth
              label="Sitio web"
              value={form.sitio}
              onChange={(e) => setForm((f) => ({ ...f, sitio: e.target.value }))}
              placeholder="sitio.com"
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Categoría"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="Ej. Diseño Gráfico"
            />
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Dirección"
            value={form.direccion}
            onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
            placeholder="Calle, número, colonia, ciudad"
            sx={{ mb: 1.5 }}
          />
          <FormControlLabel
            control={<Switch checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />}
            label="Activo"
          />

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
            <Button startIcon={<AddIcon />} variant="outlined" color="primary" onClick={onNuevo}>
              Nuevo
            </Button>
            <Button startIcon={<CancelIcon />} variant="outlined" color="error" onClick={onCancelar}>
              Cancelar
            </Button>
            <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={onGuardar}>
              Guardar
            </Button>
          </Stack>
        </Paper>

        {/* Buscador + Grid (no editable, sin ID) */}
        <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>
            Negocios dados de alta
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Buscador arriba del grid */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}   // <-- más separación con el grid
          >
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
            size="small"
            fullWidth
            sx={{
              maxWidth: { xs: "100%", md: 720 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 20,
                height: 44, // alto fijo para centrar verticalmente
              },
              "& .MuiOutlinedInput-input": {
                paddingY: 0,           // sin padding vertical
                lineHeight: "44px",    // igual al alto para centrar (truco fiable)
                textAlign: "left",
              },
              "& .MuiOutlinedInput-input::placeholder": {
                textAlign: "left",     // placeholder alineado a la izquierda
                opacity: 0.85,
              },
            }}
          />
          </Stack>

          <Box sx={{ height: 620, width: "100%" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(r) => r.id}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}

            // 1) Marca las filas pares/impares con una clase
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
            }

            // 2) Estilos para las clases even/odd
            sx={{
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "action.hover",
                fontWeight: 700,
              },
              // Blanco para pares
              "& .MuiDataGrid-row.even": {
                backgroundColor: "#ffffff",
              },
              // Azul bajito para impares (sky-500 @ ~6% de opacidad)
              "& .MuiDataGrid-row.odd": {
                backgroundColor: "rgba(14, 165, 233, 0.06)",
              },
              // Hover bonito (un poco más marcado)
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(14, 165, 233, 0.12) !important",
              },
              // Quita outlines feos al enfocar celdas
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
            }}
          />
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
