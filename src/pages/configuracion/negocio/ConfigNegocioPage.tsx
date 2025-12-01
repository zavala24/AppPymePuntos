import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
  Snackbar,
  Alert,
  Autocomplete,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import RefreshIcon from "@mui/icons-material/Refresh";
import MuiTooltip from "@mui/material/Tooltip";

import { NegocioRepository } from "@/infrastructure/repositories/NegocioRepository";
import { NegocioService } from "@/application/services/NegocioService";
import type { INegocioService } from "@/application/services/INegocioService";
import type { NegocioDto } from "@/application/dtos/NegocioDto";
import type { NegocioConfigDto } from "@/application/dtos/negocio/NegocioConfigDto";
import type { CreateUpdateNegocioConfigDto } from "@/application/dtos/negocio/CreateUpdateNegocioConfigDto";

const negocioService: INegocioService = new NegocioService(new NegocioRepository());

// Tipos
type NegOption = { id: number; nombre: string };

type FormState = {
  negocio: NegOption | null;
  porcentajeVentas: string;
  logoUrl: string;
};

type Row = {
  id: number;
  idNegocio: number;
  nombreNegocio: string;
  porcentaje: number | string | null;
  logoUrl: string | null;
};

export default function ConfigNegocioPage() {
  // Hook para detectar móvil
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ---------- Toast ----------
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  // ---------- Edición ----------
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const isEditing = editingId != null && editingId > 0;

  // ---------- Form ----------
  const [form, setForm] = React.useState<FormState>({
    negocio: null,
    porcentajeVentas: "",
    logoUrl: "",
  });
  const [saving, setSaving] = React.useState(false);

  // Validación del porcentaje
  const percentRegex = /^\d*(?:[.,]\d*)?$/;
  const onPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (percentRegex.test(v)) setForm((f) => ({ ...f, porcentajeVentas: v }));
  };
  const parsedPercent = React.useMemo(() => {
    const cleaned = form.porcentajeVentas.replace(",", ".").trim();
    if (cleaned === "" || cleaned === ".") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [form.porcentajeVentas]);

  const canSave =
    !!form.negocio && Number.isFinite(parsedPercent) && parsedPercent >= 0 && parsedPercent <= 100;

  const clearForm = () => {
    setForm({ negocio: null, porcentajeVentas: "", logoUrl: "" });
    setEditingId(null);
  };
  const onCancelarEdicion = () => clearForm();

  // ---------- Autocomplete negocios ----------
  const [negOptions, setNegOptions] = React.useState<NegOption[]>([]);
  const [negLoading, setNegLoading] = React.useState(false);
  const [negQuery, setNegQuery] = React.useState("");

  const fetchNegocios = React.useCallback(async (q: string) => {
    try {
      setNegLoading(true);
      const resp = await negocioService.getPaged(1, 10, q || null);
      if (resp.status === 200 && resp.data) {
        setNegOptions(
          resp.data.items.map((n: NegocioDto) => ({ id: n.idNegocio, nombre: n.nombre }))
        );
      } else {
        setNegOptions([]);
      }
    } catch {
      setNegOptions([]);
    } finally {
      setNegLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => fetchNegocios(negQuery), 350);
    return () => clearTimeout(t);
  }, [negQuery, fetchNegocios]);

  React.useEffect(() => {
    fetchNegocios("");
  }, [fetchNegocios]);

  // ---------- Grid ----------
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rowCount, setRowCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const mapToRow = (cfg: NegocioConfigDto): Row => ({
    id: cfg.idConfiguracionNegocio,
    idNegocio: cfg.idNegocio,
    nombreNegocio: cfg.negocioNombre,
    porcentaje: (cfg as any).porcentaje ?? cfg.porcentajeVentas ?? null,
    logoUrl: cfg.urlLogo ?? null,
  });

  const loadConfigs = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await negocioService.getConfigsPaged(
        paginationModel.page + 1,
        paginationModel.pageSize,
        search || null
      );
      if (res.status === 200 && res.data) {
        setRowCount(res.data.total);
        setRows(res.data.items.map(mapToRow));
      } else {
        setRowCount(0);
        setRows([]);
      }
    } catch {
      setRowCount(0);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, search]);

  React.useEffect(() => {
    const t = setTimeout(() => loadConfigs(), 450);
    return () => clearTimeout(t);
  }, [search, loadConfigs]);

  React.useEffect(() => {
    loadConfigs();
  }, [paginationModel.page, paginationModel.pageSize, loadConfigs]);

  // ---------- Guardar ----------
  const onGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.negocio) return showToast("Selecciona un negocio.", "error");
    if (!Number.isFinite(parsedPercent) || parsedPercent < 0 || parsedPercent > 100)
      return showToast("Ingresa un porcentaje válido (0-100).", "error");

    try {
      setSaving(true);

      const dto: CreateUpdateNegocioConfigDto = {
        idNegocio: form.negocio.id,
        usuarioNombre: localStorage.getItem("pa_user"),
        porcentajeVentas: parsedPercent,
        urlLogo: form.logoUrl?.trim() || null,
      };

      const resp = await negocioService.createOrUpdateConfigBusiness(dto);

      if (resp.status === 200 || resp.status === 201) {
        showToast(resp.message || "Configuración guardada.", "success");
        setPaginationModel((m) => ({ ...m, page: 0 }));
        await loadConfigs();
        clearForm();
      } else {
        showToast(resp.message || "No se pudo guardar.", "error");
      }
    } catch (err: any) {
      showToast(err?.message ?? "Error al guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Click en fila ----------
  const onRowClick = (params: any) => {
    const r = params.row as Row;
    setNegOptions((opts) => {
      const exists = opts.some((o) => o.id === r.idNegocio);
      return exists ? opts : [{ id: r.idNegocio, nombre: r.nombreNegocio }, ...opts];
    });

    setForm({
      negocio: { id: r.idNegocio, nombre: r.nombreNegocio },
      porcentajeVentas: r.porcentaje != null ? String(r.porcentaje) : "",
      logoUrl: r.logoUrl ?? "",
    });
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- Columnas ----------
  const columns: GridColDef<Row>[] = [
    { field: "nombreNegocio", headerName: "Nombre negocio", minWidth: 180, flex: 1.2 },
    {
      field: "porcentaje",
      headerName: "Porcentaje %",
      minWidth: 120, // Ancho fijo mínimo
      flex: 0.8,
      type: "number",
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        const v = Number(params ?? 0);
        if (!Number.isFinite(v)) return "—";
        return `${v.toLocaleString("es-MX")} %`;
      },
    },
    {
      field: "logoUrl",
      headerName: "URL Logo",
      minWidth: 200, 
      flex: 1.2,
      renderCell: (p) =>
        p.value ? (
          <a href={String(p.value)} target="_blank" rel="noreferrer" style={{ color: "#1976d2", textDecoration: 'underline' }}>
            Ver logo
          </a>
        ) : (
          <span style={{ color: "#94a3b8" }}>—</span>
        ),
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  const previewUrl = React.useMemo(
    () => (form.logoUrl?.trim().length ? form.logoUrl.trim() : ""),
    [form.logoUrl]
  );

  return (
    <Box className="mx-auto w-full max-w-[1800px] px-2 md:px-6 py-4">
      
      {/* Header Responsivo */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        justifyContent="space-between" 
        gap={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Configuración
        </Typography>
        <Chip icon={<ShieldIcon />} label="Solo SUPER ADMIN" color="secondary" variant="outlined" size={isMobile ? "small" : "medium"} />
      </Stack>

      {/* === FORM === */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 2 }}>
          {isEditing ? "Editar configuración" : "Nueva configuración"}
        </Typography>

        <Box component="form" onSubmit={onGuardar}>
          <Box
            sx={{
              display: "grid",
              // En móvil: 1 columna. En PC: Grid complejo
              gridTemplateColumns: { xs: "1fr", md: "1fr 0.45fr 220px" },
              gridTemplateRows: { xs: "auto", md: "auto auto" },
              columnGap: 2,
              rowGap: 2,
              mb: 2,
              alignItems: "stretch",
            }}
          >
            {/* Negocio */}
            <Box>
              <Autocomplete<NegOption, false, false, false>
                fullWidth
                loading={negLoading}
                options={negOptions}
                value={form.negocio}
                onChange={(_, v) => setForm((f) => ({ ...f, negocio: v }))}
                inputValue={negQuery}
                onInputChange={(_, v) => setNegQuery(v)}
                getOptionLabel={(o) => o?.nombre ?? ""}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Negocio *"
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
            </Box>

            {/* Porcentaje */}
            <Box>
              <TextField
                fullWidth
                label="Porcentaje (%) *"
                placeholder="Ej. 0.01"
                inputMode="decimal"
                value={form.porcentajeVentas}
                onChange={onPercentChange}
                error={
                  form.porcentajeVentas !== "" &&
                  !(Number.isFinite(parsedPercent) && parsedPercent >= 0 && parsedPercent <= 100)
                }
              />
            </Box>

            {/* URL Logo - Ocupa ancho completo en móvil */}
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / 3" } }}>
              <TextField
                fullWidth
                label="URL del logo"
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://.../logo.png"
              />
            </Box>

            {/* Preview logo - Ajustado para móvil */}
            <Box
              sx={{
                gridColumn: { xs: "1 / -1", md: "3 / 4" },
                gridRow: { xs: "auto", md: "1 / span 2" },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: { xs: 120, md: "100%" }, // Menos alto en móvil
                width: "100%",
                position: "relative",
                overflow: "hidden",
                bgcolor: "transparent",
                border: { xs: '1px dashed #e2e8f0', md: 'none' }, // Borde guía en móvil
                borderRadius: 2
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Logo"
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Sin logo
                </Typography>
              )}
            </Box>
          </Box>

          {/* Botones */}
          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={clearForm}>
              Nuevo
            </Button>

            {isEditing && (
              <Button
                startIcon={<CancelIcon />}
                variant="outlined"
                color="warning"
                onClick={onCancelarEdicion}
              >
                Cancelar
              </Button>
            )}

            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              color="success"
              type="submit"
              disabled={!canSave || saving}
            >
              {saving ? (isEditing ? "Actualizando..." : "Guardando...") : (isEditing ? "Actualizar" : "Guardar")}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* === GRID RESPONSIVO === */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, width: '100%', overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Listado
          </Typography>
          <MuiTooltip title="Refrescar">
            <IconButton
              size="small"
              onClick={() => loadConfigs()}
              sx={{ color: "primary.main", "&:hover": { color: "primary.dark" } }}
            >
              <RefreshIcon />
            </IconButton>
          </MuiTooltip>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <TextField
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPaginationModel((m) => ({ ...m, page: 0 }));
          }}
          placeholder="Buscar negocio..."
          size="small"
          fullWidth
          sx={{ mb: 3, maxWidth: { xs: "100%", md: 720 } }}
        />

        {/* Contenedor con Scroll Horizontal */}
        <Box sx={{ height: dynamicHeight, width: "100%", overflowX: 'auto' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            onRowClick={onRowClick}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50]}
            getRowClassName={(p) => (p.indexRelativeToCurrentPage % 2 === 0 ? "row-even" : "row-odd")}
            // Ocultar columna Logo en móvil
            initialState={{
              columns: {
                columnVisibilityModel: {
                  logoUrl: !isMobile,
                },
              },
            }}
            sx={{
              minWidth: isMobile ? 500 : '100%', // Ancho mínimo para forzar scroll si es necesario
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

      {/* Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}