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
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/CheckCircle";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShieldIcon from "@mui/icons-material/Security";
import EventIcon from "@mui/icons-material/Event"; // Importante

// --- IMPORTS DE FECHA ---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from "dayjs";
import 'dayjs/locale/es';

import { ProductosCustomRepository } from "@/infrastructure/repositories/ProductosCustomRepository";
import { ProductosCustomService } from "@/application/services/ProductosCustomService";
import type { IProductosCustomService } from "@/application/services/IProductosCustomService";
import {
  ProductoCustomDto,
  UpsertProductoCustomRequest,
} from "@/application/dtos/productos-custom/ProductoCustomDtos";

const productosService: IProductosCustomService = new ProductosCustomService(
  new ProductosCustomRepository()
);

type Row = ProductoCustomDto & { id: number; fechaCaducidad?: string | null };

type FormState = {
  idProductoCustom: number | null;
  nombreProducto: string;
  descripcion: string;
  meta: string;
  porcentajePorCompra: string;
  tipoAcumulacion: string;
  recompensa: string;
  fechaCaducidad: string;
  estado: boolean;
};

function getUsuarioActual(): string {
  return (
    localStorage.getItem("pa_user") ||
    localStorage.getItem("usuario") ||
    localStorage.getItem("usuarioNombre") ||
    "admin"
  );
}
function toNumberSafe(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatDateDisplay(iso: string | null | undefined) {
  if (!iso) return "—";
  const datePart = iso.split('T')[0];
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

function toInputDate(iso: string | null | undefined) {
  if (!iso) return "";
  return iso.split("T")[0];
}

export default function CustomProductsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const [form, setForm] = React.useState<FormState>({
    idProductoCustom: null,
    nombreProducto: "",
    descripcion: "",
    meta: "",
    porcentajePorCompra: "",
    tipoAcumulacion: "Compra",
    recompensa: "",
    fechaCaducidad: "",
    estado: true,
  });
  
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
  
  // --- NUEVO ESTADO PARA CONTROLAR APERTURA DEL CALENDARIO ---
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const isEditing = form.idProductoCustom != null;

  const metaNum = React.useMemo(() => toNumberSafe(form.meta, NaN), [form.meta]);
  const pctNum = React.useMemo(
    () => toNumberSafe(form.porcentajePorCompra, NaN),
    [form.porcentajePorCompra]
  );

  const pctRequired = true;
  const metaValid = Number.isFinite(metaNum) && metaNum > 0;
  const pctValid =
    !pctRequired || (Number.isFinite(pctNum) && pctNum > 0 && pctNum <= 100);

  const nombreOk = form.nombreProducto.trim().length > 0;
  const canSave = nombreOk && metaValid && pctValid;

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const usuario = getUsuarioActual();
      const resp = await productosService.GetProductosCustomByUsuario(usuario);
      if (resp.status === 200 && resp.data) {
        const dataMapped = resp.data.map((p) => ({
          ...p,
          id: p.idProductoCustom,
          fechaCaducidad: (p as any).fechaCaducidad ?? null, 
        }));
        setRows(dataMapped);
      } else {
        setRows([]);
        showToast(resp.message || "No se pudieron cargar las promociones.", "error");
      }
    } catch (e: any) {
      setRows([]);
      showToast(e?.message ?? "Error al cargar.", "error");
    } finally {
      setLoading(false);
    }
  }, []);
  
  React.useEffect(() => {
    load();
  }, [load]);

  const clearForm = () => {
    setForm({
      idProductoCustom: null,
      nombreProducto: "",
      descripcion: "",
      meta: "",
      porcentajePorCompra: "",
      tipoAcumulacion: "Compra",
      recompensa: "",
      fechaCaducidad: "",
      estado: true,
    });
    setSelectedDate(null);
  };

  const onRowClick = (params: any) => {
    const r = params.row as Row;
    
    let dateObj: Dayjs | null = null;
    if (r.fechaCaducidad) {
        dateObj = dayjs(r.fechaCaducidad);
    }

    setForm({
      idProductoCustom: r.idProductoCustom,
      nombreProducto: r.nombreProducto ?? "",
      descripcion: r.descripcion ?? "",
      meta: String(r.meta ?? ""),
      porcentajePorCompra: String(r.porcentajePorCompra ?? ""),
      tipoAcumulacion: r.tipoAcumulacion ?? "Compra",
      recompensa: r.recompensa ?? "",
      fechaCaducidad: toInputDate(r.fechaCaducidad),
      estado: !!r.estado,
    });
    setSelectedDate(dateObj);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onGuardar = async () => {
    if (!canSave) return;
    
    const fechaFinal = selectedDate ? selectedDate.toISOString() : null;

    const req: any = {
      usuario: getUsuarioActual(),
      usuarioOperacion: getUsuarioActual(),
      idProductoCustom: form.idProductoCustom ?? undefined,
      nombreProducto: form.nombreProducto.trim(),
      descripcion: form.descripcion.trim() || null,
      meta: toNumberSafe(form.meta, 0),
      porcentajePorCompra: pctRequired
        ? toNumberSafe(form.porcentajePorCompra, 0)
        : 0,
      tipoAcumulacion: form.tipoAcumulacion || "Compra",
      recompensa: form.recompensa.trim() || null,
      fechaCaducidad: fechaFinal,
      estado: form.estado,
    };

    try {
      const resp = await productosService.upsertProductoCustom(req as UpsertProductoCustomRequest);
      if (resp.status === 200 || resp.status === 201) {
        showToast(
          resp.message ||
            (isEditing ? "Promoción actualizada" : "Promoción creada"),
          "success"
        );
        clearForm();
        await load();
      } else {
        showToast(resp.message || "No se pudo guardar.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al guardar.", "error");
    }
  };

  const onConfirmDelete = async () => {
    if (!form.idProductoCustom) {
      setDeleteOpen(false);
      return;
    }

    try {
      const resp = await productosService.deleteProductoCustom(form.idProductoCustom);

      if (resp.status === 200 && resp.data) {
        showToast(resp.message || "Promoción eliminada correctamente.", "success");
        clearForm();
        await load();
      } else {
        showToast(resp.message || "No se pudo eliminar la promoción.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al eliminar.", "error");
    } finally {
      setDeleteOpen(false);
    }
  };

  const columns: GridColDef<Row>[] = [
    { field: "nombreProducto", headerName: "Producto", minWidth: 140, flex: 1.2 },
    { field: "descripcion", headerName: "Descripción", minWidth: 180, flex: 1.4 },
    {
      field: "meta",
      headerName: "Meta",
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "porcentajePorCompra",
      headerName: "% x compra",
      width: 100,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) => `${p}%`,
    },
    { 
      field: "fechaCaducidad", 
      headerName: "Vence", 
      width: 110,
      align: "center",
      headerAlign: "center",
      valueGetter: (val) => formatDateDisplay(val as string)
    },
    { field: "recompensa", headerName: "Recompensa", minWidth: 140, flex: 1.0 },
    {
      field: "estado",
      headerName: "Activo",
      width: 80,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? (
          <CheckIcon color="success" fontSize="small" />
        ) : (
          <RemoveIcon color="disabled" fontSize="small" />
        ),
      sortable: false,
      filterable: false,
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box className="mx-auto w-full max-w-[1800px] px-2 md:px-6 py-4">
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          justifyContent="space-between" 
          gap={1}
          sx={{ mb: 2 }}
        >
          <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Promociones
          </Typography>
          <Chip
            icon={<ShieldIcon />}
            label="Solo ADMIN"
            color="secondary"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
          />
        </Stack>

        <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }} color="primary">
            {isEditing ? "Editar promoción" : "Nueva promoción"}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              columnGap: 2,
              rowGap: 2,
            }}
          >
            <TextField
              label="Producto"
              value={form.nombreProducto}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombreProducto: e.target.value }))
              }
              required
            />
            
            {/* --- DATE PICKER CON CONTROL MANUAL --- */}
            <DatePicker
              label="Fecha de caducidad (Opcional)"
              value={selectedDate}
              onChange={(newValue: any) => {
                setSelectedDate(newValue);
                const dateStr = newValue ? newValue.format("YYYY-MM-DD") : "";
                setForm((f) => ({ ...f, fechaCaducidad: dateStr }));
              }}
              // Control manual de apertura
              open={calendarOpen}
              onOpen={() => setCalendarOpen(true)}
              onClose={() => setCalendarOpen(false)}
              
              format="DD-MMM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { "& .MuiOutlinedInput-root": { borderRadius: 1 } },
                  helperText: "Opcional",
                  // También abrimos al dar click en el input (opcional)
                  onClick: () => setCalendarOpen(true),
                  InputProps: {
                    endAdornment: (
                      <React.Fragment>
                        {/* Botón X para limpiar */}
                        {selectedDate && (
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(null);
                              setForm((f) => ({ ...f, fechaCaducidad: "" }));
                            }}
                            edge="end"
                            size="small"
                            sx={{ mr: 0.5 }}
                          >
                            <CancelIcon fontSize="small" color="action" />
                          </IconButton>
                        )}
                        {/* Botón Calendario que abre el picker */}
                        <IconButton onClick={(e) => {
                            e.stopPropagation();
                            setCalendarOpen(true);
                        }}>
                            <EventIcon color="action" />
                        </IconButton>
                      </React.Fragment>
                    ),
                  },
                },
                // Quitamos la barra inferior para que se vea limpio
                actionBar: { actions: [] } 
              }}
            />

            <TextField
              label="Meta (compras necesarias)"
              value={form.meta}
              onChange={(e) => setForm((f) => ({ ...f, meta: e.target.value }))}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              error={form.meta !== "" && !metaValid}
              helperText="Ej. 5 (debe ser mayor a 0)"
              required
            />
            <TextField
              label="% por compra"
              value={form.porcentajePorCompra}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  porcentajePorCompra: e.target.value,
                }))
              }
              inputProps={{ inputMode: "decimal" }}
              error={
                pctRequired &&
                form.porcentajePorCompra !== "" &&
                !pctValid
              }
              helperText={
                pctRequired
                  ? "Entre 0 y 100. Ej. 20"
                  : "Opcional"
              }
              required={pctRequired}
            />

            <TextField
              label="Recompensa (texto)"
              value={form.recompensa}
              onChange={(e) =>
                setForm((f) => ({ ...f, recompensa: e.target.value }))
              }
            />
            
            <TextField
              label="Descripción (opcional)"
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              multiline
              minRows={1}
            />
          </Box>

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Switch
                checked={form.estado}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estado: e.target.checked }))
                }
              />
            }
            label="Activo"
          />

          <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={clearForm}>
              Nuevo
            </Button>
            {isEditing && (
              <Button
                startIcon={<CancelIcon />}
                variant="outlined"
                color="warning"
                onClick={clearForm}
              >
                Cancelar
              </Button>
            )}
            {isEditing && (
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={() => setDeleteOpen(true)}
              >
                Eliminar
              </Button>
            )}
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              color="success"
              onClick={onGuardar}
              disabled={!canSave}
            >
              {isEditing ? "Actualizar" : "Guardar"}
            </Button>
          </Stack>
        </Paper>

        {/* Grid */}
        <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, width: '100%', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={700} color="primary">
              Promociones del negocio
            </Typography>
            
            <Tooltip title="Refrescar">
              <IconButton onClick={() => load()} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            size="small"
            fullWidth
            sx={{ mb: 3, maxWidth: { xs: "100%", md: 400 } }}
          />

          <Box sx={{ height: dynamicHeight, width: "100%", overflowX: 'auto' }}>
            <DataGrid
              rows={rows.filter((r) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                  r.nombreProducto?.toLowerCase().includes(q) ||
                  (r.tipoAcumulacion ?? "").toLowerCase().includes(q) ||
                  (r.recompensa ?? "").toLowerCase().includes(q) ||
                  (r.descripcion ?? "").toLowerCase().includes(q)
                );
              })}
              columns={columns}
              getRowId={(r) => r.id}
              loading={loading}
              disableRowSelectionOnClick
              onRowClick={onRowClick}
              paginationMode="client"
              rowCount={rows.length}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 20, 50]}
              getRowClassName={(p) =>
                p.indexRelativeToCurrentPage % 2 === 0 ? "row-even" : "row-odd"
              }
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    descripcion: !isMobile,
                    tipoAcumulacion: !isMobile,
                  },
                },
              }}
              sx={{
                minWidth: isMobile ? 800 : '100%',
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "action.hover",
                  fontWeight: 700,
                },
                "& .row-even": { backgroundColor: "#ffffff" },
                "& .row-odd": { backgroundColor: "rgba(14,165,233,0.06)" },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(14,165,233,0.12) !important",
                },
                "& .MuiDataGrid-cell:focus": { outline: "none" },
              }}
            />
          </Box>
        </Paper>

        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: "primary.main", fontWeight: 700 }}>
            Eliminar promoción
          </DialogTitle>
          <DialogContent>
            Esta acción desactivará o eliminará la configuración de la promoción.
            ¿Deseas continuar?
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onConfirmDelete}
              disabled={!form.idProductoCustom}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

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
    </LocalizationProvider>
  );
}