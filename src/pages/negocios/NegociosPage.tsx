import * as React from "react";
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack,
  FormControlLabel, Switch, Divider, Snackbar, Alert
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";

import { NegocioRepository } from "../../infrastructure/repositories/NegocioRepository";
import { NegocioService } from "../../application/services/NegocioService";
import type { INegocioService } from "../../application/services/INegocioService";
import type { CreateNegocioDto } from "@/application/dtos/negocio/CreateNegocioDto";
import { NegocioDto } from "@/application/dtos/NegocioDto";

const negocioService: INegocioService = new NegocioService(new NegocioRepository());

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

  // ------- Grid / Datos -------
  const [rows, setRows] = React.useState<NegocioRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rowCount, setRowCount] = React.useState(0);
  const [search, setSearch] = React.useState("");

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

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

  // ------- Helpers -------
  const mapToRow = (n: NegocioDto): NegocioRow => ({
    id: n.idNegocio,
    nombre: n.nombre,
    categoria: n.categoria ?? "",
    facebook: n.facebook ?? "",
    instagram: n.instagram ?? "",
    sitio: n.sitioWeb ?? "",
    direccion: n.direccion ?? "",
    activo: !!n.esActivo,
  });

  const loadPage = React.useCallback(async () => {
    try {
      setLoading(true);
      const { page, pageSize } = paginationModel;
      const resp = await negocioService.getPaged(page + 1, pageSize, search || null);
      if (resp.status === 200 && resp.data) {
        setRows(resp.data.items.map(mapToRow));
        setRowCount(resp.data.total);
      } else {
        setRows([]);
        setRowCount(0);
        if (resp.message) showToast(resp.message, "error");
      }
    } catch (e: any) {
      setRows([]);
      setRowCount(0);
      showToast(e?.message ?? "Error al cargar negocios.", "error");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search]);

  // 🔁 Debounce de búsqueda
  React.useEffect(() => {
    const delay = setTimeout(() => {
      loadPage();
    }, 600);
    return () => clearTimeout(delay);
  }, [search, loadPage]);

  // 🔁 Cargar al montar o cambiar de página
  React.useEffect(() => {
    loadPage();
  }, [paginationModel]);

  // ------- Acciones -------
  const onNuevo = () =>
    setForm({ nombre: "", facebook: "", instagram: "", sitio: "", direccion: "", categoria: "", activo: true });

  const onCancelar = () => onNuevo();

  const [saving, setSaving] = React.useState(false);
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
      sitioWeb: form.sitio || null,
      direccion: form.direccion || null,
      activo: form.activo,
    };

    try {
      setSaving(true);
      const resp = await negocioService.create(dto);

      if (resp.status === 201) {
        showToast(resp.message || "Negocio creado con éxito.", "success");
        onNuevo();
        setPaginationModel((m) => ({ ...m, page: 0 }));
        await loadPage();
      } else {
        showToast(resp.message || "No se pudo crear el negocio.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error de red.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ------- Columnas del grid -------
  const columns: GridColDef<NegocioRow>[] = [
    {
      field: "nombre",
      headerName: "Nombre",
      flex: 1.1,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={600}>{p.value as string}</Typography>
        </Stack>
      ),
    },
    { field: "categoria", headerName: "Categoría", flex: 0.9 },
    { field: "facebook", headerName: "Facebook", flex: 1 },
    { field: "instagram", headerName: "Instagram", flex: 1 },
    { field: "sitio", headerName: "Sitio web", flex: 0.9 },
    { field: "direccion", headerName: "Dirección", flex: 1.2 },
    {
  field: "activo",
  headerName: "Activo",
  width: 110,
  align: "center",
  renderCell: (p) =>
    p.value ? (
      <CheckIcon color="success" fontSize="small" />
    ) : (
      <CancelIcon color="error" fontSize="small" />
    ),
}
  ];

  // 🧮 Altura dinámica (ajusta filas visibles)
  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  return (
    <Box className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4">
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" color="primary">Negocios</Typography>
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
          />
          <TextField
            fullWidth
            label="Facebook"
            value={form.facebook}
            onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Instagram"
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Sitio web"
            value={form.sitio}
            onChange={(e) => setForm((f) => ({ ...f, sitio: e.target.value }))}
          />
        </Stack>

        <TextField
          fullWidth
          label="Categoría"
          value={form.categoria}
          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Dirección"
          value={form.direccion}
          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={<Switch checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />}
          label="Activo"
        />

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button startIcon={<AddIcon />} variant="outlined" color="primary" onClick={onNuevo}>Nuevo</Button>
          <Button startIcon={<CancelIcon />} variant="outlined" color="error" onClick={onCancelar}>Cancelar</Button>
          <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={onGuardar} disabled={saving}>
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

        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar negocio..."
          size="small"
          fullWidth
          sx={{
            mb: 3,
            maxWidth: { xs: "100%", md: 720 },
            "& .MuiOutlinedInput-root": { borderRadius: 20, height: 44 },
            "& .MuiOutlinedInput-input": { lineHeight: "44px" },
          }}
        />

        {/* Grid con altura dinámica */}
        <Box sx={{ height: dynamicHeight, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50]}
            getRowClassName={(p) =>
              p.indexRelativeToCurrentPage % 2 === 0 ? "row-even" : "row-odd"
            }
            slots={{
              noRowsOverlay: () => (
                <Stack height="100%" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">Sin datos</Typography>
                </Stack>
              ),
              loadingOverlay: () => (
                <Stack height="100%" alignItems="center" justifyContent="center">
                  <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                </Stack>
              ),
            }}
            sx={{
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "action.hover",
                fontWeight: 700,
              },
              "& .row-even": { backgroundColor: "#ffffff" },
              "& .row-odd": { backgroundColor: "rgba(14,165,233,0.06)" },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(14,165,233,0.12) !important",
              },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
            }}
          />
        </Box>
      </Paper>

      {/* TOASTS */}
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
