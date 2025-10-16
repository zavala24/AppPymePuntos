import * as React from "react";
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack,
  FormControlLabel, Switch, Divider, Snackbar, Alert
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";

// Servicio/Repositorio
import { NegocioRepository } from "../../infrastructure/repositories/NegocioRepository";
import { NegocioService } from "../../application/services/NegocioService";
import type { INegocioService } from "../../application/services/INegocioService";
import { CreateNegocioDto } from "@/application/dtos/negocio/CreateNegocioDto";

const negocioService: INegocioService = new NegocioService(new NegocioRepository());

// ==== Tipos locales para la grilla ====
interface NegocioRow {
  id: number; // temporal para la grilla
  nombre: string;
  facebook?: string;
  instagram?: string;
  sitio?: string;
  direccion?: string;
  categoria?: string;
  activo: boolean;
}

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

  // 🧼 Grid SIN datos dummy
  const [rows, setRows] = React.useState<NegocioRow[]>([]);
  const [saving, setSaving] = React.useState(false);

  // ------- Toasts -------
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (msg: string, severity: "success" | "error") => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  };
  const handleToastClose = () => setToastOpen(false);

  // ------- Acciones -------
  const onNuevo = () =>
    setForm({ nombre: "", facebook: "", instagram: "", sitio: "", direccion: "", categoria: "", activo: true });

  const onCancelar = () => onNuevo();

  const onGuardar = async () => {
    if (!form.nombre.trim()) {
      showToast("El nombre es obligatorio.", "error");
      return;
    }

    const dto: CreateNegocioDto = {
      nombre: form.nombre.trim(),
      categoria: form.categoria || null,
      facebook: form.facebook || null,
      instagram: form.instagram || null,
      sitioWeb: form.sitio || null,   // 👈 coincide con DTO backend
      direccion: form.direccion || null,
      activo: form.activo,
    };

    try {
      setSaving(true);
      const resp = await negocioService.create(dto);

      if (resp.status === 201) {
        showToast(resp.message || "Negocio creado con éxito.", "success");

        // Agregamos fila temporal hasta que implementes el GET (usaremos un id incremental)
        const nextId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
        const d = resp.data ?? dto; // si el back no manda data, usamos el dto
        const newRow: NegocioRow = {
          id: nextId,
          nombre: d.nombre,
          categoria: d.categoria ?? "",
          facebook: d.facebook ?? "",
          instagram: d.instagram ?? "",
          sitio: d.sitioWeb ?? "",
          direccion: d.direccion ?? "",
          activo: d.activo,
        };
        setRows(r => [newRow, ...r]);
        onNuevo();
      } else {
        showToast(resp.message || "No se pudo crear el negocio.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error de red.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ------- Grid columns -------
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

  // ------- Buscador -------
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
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            color="success"
            onClick={onGuardar}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      {/* Buscador + Grid */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>
          Negocios dados de alta
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
            size="small"
            fullWidth
            sx={{
              maxWidth: { xs: "100%", md: 720 },
              "& .MuiOutlinedInput-root": { borderRadius: 20, height: 44 },
              "& .MuiOutlinedInput-input": { lineHeight: "44px" },
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
            getRowClassName={(p) => (p.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd")}
            slots={{
              // Overlay cuando no hay filas
              noRowsOverlay: () => (
                <Stack height="100%" alignItems="center" justifyContent="center" spacing={1}>
                  <Typography variant="body1" color="text.secondary">Sin datos</Typography>
                  <Typography variant="caption" color="text.secondary">Agrega tu primer negocio con “Guardar”.</Typography>
                </Stack>
              ),
            }}
            sx={{
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              "& .MuiDataGrid-row.even": { backgroundColor: "#fff" },
              "& .MuiDataGrid-row.odd": { backgroundColor: "rgba(14,165,233,.06)" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,.12) !important" },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            }}
          />
        </Box>
      </Paper>

      {/* TOASTS (arriba-derecha) */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleToastClose} severity={toastSeverity} variant="filled" sx={{ width: "100%" }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
