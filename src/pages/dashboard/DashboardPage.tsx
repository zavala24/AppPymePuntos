import * as React from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Divider,
  Grid,
  Chip,
} from "@mui/material";
import MuiTooltip from "@mui/material/Tooltip";
import Autocomplete from "@mui/material/Autocomplete";

import RefreshIcon from "@mui/icons-material/Refresh";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import PolylineIcon from "@mui/icons-material/Polyline";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import ShieldIcon from "@mui/icons-material/Security";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

// Date pickers
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

// Excel / Imagen
import * as XLSX from "xlsx";
import * as htmlToImage from "html-to-image";

// Services
import { SellRepository } from "@/infrastructure/repositories/SellRepository";
import { SellService } from "@/application/services/SellService";
import { ServiceResponse } from "@/shared/types/service-response";
import {
  DashboardVentasCustomRequest,
  DashboardVentasCustomResponse,
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";

import { api } from "@/infrastructure/http/api";

const sellService = new SellService(new SellRepository());

// DTO local para actualizar
type UpdateVentaFromRowDto = {
  folio: number;
  articulo: string;
  descripcion: string;
  monto: number;
  cantidad: number;
  idNegocio: number;
  usuarioNombre: string;
};

// DTO local para eliminar (front)
type DeleteVentaFromRowDto = {
  folio: number;
  idNegocio: number;
  usuarioNombre: string;
};

function getIdNegocioActual(): number | undefined {
  const ls = localStorage.getItem("pa_idNegocio");
  if (ls && !Number.isNaN(Number(ls))) return Number(ls);

  const token = localStorage.getItem("pa_token");
  if (!token) return undefined;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    const n = Number(payload?.idNegocio);
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

/* ============ Helpers ============ */
function fmtCurrency(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtDateAxis(value: string) {
  const d = dayjs(value);
  if (!d.isValid()) return value;
  return d.format("DD-MMM-YYYY").toLowerCase();
}

function niceBtn() {
  return {
    borderRadius: 2,
    textTransform: "none",
    px: 1.5,
    minWidth: 0,
    height: 32,
  } as const;
}
const SOFT_COLORS = [
  "#60a5fa",
  "#34d399",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
  "#86efac",
];

/* ============ Tipos auxiliares ============ */
type NegocioOption = { id: number; nombre: string };

const isCustom = (v: any) =>
  v === true || v === 1 || String(v).toLowerCase() === "true";

/* ============ Componente principal ============ */
export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const usuarioNombre = localStorage.getItem("pa_user") || "";
  const role = (localStorage.getItem("pa_role") || "").toLowerCase();
  const isSuperAdmin = role === "superadmin";

  const [desde, setDesde] = React.useState<Dayjs | null>(dayjs().startOf("day"));
  const [hasta, setHasta] = React.useState<Dayjs | null>(dayjs().endOf("day"));

  const [negocios, setNegocios] = React.useState<NegocioOption[]>([]);
  const [loadingNegocios, setLoadingNegocios] = React.useState(false);
  const [negocioId, setNegocioId] = React.useState<number | "">("");

  const [chartsTab, setChartsTab] = React.useState<0 | 1>(0);
  const [filterToken, setFilterToken] = React.useState(1);

  const [data, setData] = React.useState<DashboardVentasResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [customData, setCustomData] = React.useState<DashboardVentasCustomResponse | null>(null);
  const [loadingCustom, setLoadingCustom] = React.useState(false);
  const [errorCustom, setErrorCustom] = React.useState<string | null>(null);

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });
  const [loadingRows, setLoadingRows] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const ventasDiaRef = React.useRef<HTMLDivElement>(null);
  const topArtRef = React.useRef<HTMLDivElement>(null);
  const promoChartRef = React.useRef<HTMLDivElement>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  type EditForm = {
    folio: number;
    articulo: string;
    descripcion: string;
    monto: string; 
    cantidad: string;
  };

  const [editForm, setEditForm] = React.useState<EditForm>({
    folio: 0,
    articulo: "",
    descripcion: "",
    monto: "",
    cantidad: "",
  });

  const [editInitialForm, setEditInitialForm] = React.useState<EditForm | null>(null);

  const [deleteRow, setDeleteRow] = React.useState<VentaRowDto | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");

  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  const [exportingGrid, setExportingGrid] = React.useState(false);

  const openEditModal = (row: VentaRowDto) => {
    const initial: EditForm = {
      folio: Number(row.folio),
      articulo: row.articulo || "",
      descripcion: row.descripcion || "",
      monto: row.monto != null ? Number(row.monto).toFixed(2) : "",
      cantidad: String((row as any).cantidad ?? "1"),
    };
    setEditInitialForm(initial);
    setEditForm(initial);
    setEditError(null);
    setEditOpen(true);
  };

  const closeEditModal = () => {
    if (editSaving) return;
    setEditOpen(false);
  };

  const onEditChange = (key: "articulo" | "descripcion" | "monto" | "cantidad") => (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const onNumericChange = (key: "monto" | "cantidad") => (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(",", ".");
      v = v.replace(/[^\d.]/g, "");
      const firstDot = v.indexOf(".");
      if (firstDot !== -1) {
        const head = v.slice(0, firstDot + 1);
        const tail = v.slice(firstDot + 1).replace(/\./g, "");
        v = head + tail;
      }
      const m = v.match(/^(\d+)(?:\.(\d{0,2}))?$/);
      if (!v || m) {
        setEditForm((f) => ({ ...f, [key]: v }));
      }
    };

  const commitEdit = async () => {
    const idNegocio = typeof negocioId === "number" ? negocioId : getIdNegocioActual() ?? 0;

    if (!editForm.articulo.trim()) {
      setEditError("El artículo es obligatorio.");
      return;
    }
    if (!editForm.monto.trim()) {
      setEditError("El monto es obligatorio.");
      return;
    }
    if (!editForm.cantidad.trim()) {
      setEditError("La cantidad es obligatoria.");
      return;
    }

    const monto = Number(editForm.monto.replace(",", "."));
    const cantidad = Number(editForm.cantidad.replace(",", "."));

    if (!(Number.isFinite(monto) && monto > 0)) {
      setEditError("El monto debe ser un número mayor a 0 y con máximo 2 decimales.");
      return;
    }
    if (!(Number.isFinite(cantidad) && cantidad > 0)) {
      setEditError("La cantidad debe ser un número mayor a 0 y con máximo 2 decimales.");
      return;
    }

    const dto: UpdateVentaFromRowDto = {
      folio: editForm.folio,
      articulo: editForm.articulo.trim(),
      descripcion: editForm.descripcion.trim(),
      monto: Number(monto.toFixed(2)),
      cantidad: Number(cantidad.toFixed(2)),
      idNegocio,
      usuarioNombre,
    };

    try {
      setEditSaving(true);
      const resp = await sellService.updateVentaFromRow(dto as any);

      if (resp.status === 200 && resp.data) {
        await refreshGridRowsOnly();
        setEditOpen(false);
        showToast(resp.message || "Datos guardados con éxito.", "success");
      } else {
        const msg = resp.message || "No se pudo actualizar la venta.";
        setEditError(msg);
        showToast(msg, "error");
      }
    } catch (e: any) {
      const msg = e?.message ?? "Error de red al actualizar.";
      setEditError(msg);
      showToast(msg, "error");
    } finally {
      setEditSaving(false);
    }
  };

  const onCancelarEdicion = () => {
    if (editSaving) return;
    if (editInitialForm) setEditForm(editInitialForm);
    setEditOpen(false);
  };

  React.useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        setLoadingNegocios(true);
        const { data } = await api.get("/Negocio/GetNegociosPaged", {
          params: { page: 1, pageSize: 200, search: "" },
        });
        const items = (data?.data?.items ?? data?.data ?? []).map((n: any) => ({
          id: n.idNegocio ?? n.id,
          nombre: n.nombre,
        })) as NegocioOption[];
        setNegocios(items);
      } catch {
        setNegocios([]);
      } finally {
        setLoadingNegocios(false);
      }
    })();
  }, [isSuperAdmin]);

  const loadDashboard = async (overrideIdNegocio?: number | "") => {
    setLoading(true);
    setError(null);
    try {
      const selectedIdNegocio = typeof overrideIdNegocio === "number" ? overrideIdNegocio : typeof negocioId === "number" ? negocioId : getIdNegocioActual();

      const req: DashboardVentasRequest = {
        usuarioNombre,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
        page: 1,
        pageSize: 100,
        search: debouncedSearch || null,
        idNegocio: selectedIdNegocio ?? 0,
      };

      const res: ServiceResponse<DashboardVentasResponse> = await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) setData(res.data);
      else setError(res.message || "Error al obtener las ventas");
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomDashboard = async (overrideIdNegocio?: number | "") => {
    setLoadingCustom(true);
    setErrorCustom(null);
    try {
      const selectedIdNegocio = typeof overrideIdNegocio === "number" ? overrideIdNegocio : typeof negocioId === "number" ? negocioId : getIdNegocioActual();

      const req: DashboardVentasCustomRequest = {
        idNegocio: selectedIdNegocio ?? 0,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
      };

      const res = await sellService.getVentasCustomDashboard(req);
      if (res.status === 200 && res.data) setCustomData(res.data);
      else setErrorCustom(res.message || "Error al obtener las ventas personalizadas");
    } catch (err: any) {
      setErrorCustom(err.message ?? "Error inesperado al cargar promociones");
    } finally {
      setLoadingCustom(false);
    }
  };

  const refreshGridRowsOnly = React.useCallback(async () => {
    try {
      setLoadingRows(true);
      const selectedIdNegocio = typeof negocioId === "number" ? negocioId : getIdNegocioActual();

      const req: DashboardVentasRequest = {
        usuarioNombre,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
        page: 1,
        pageSize: 100,
        search: debouncedSearch || null,
        idNegocio: selectedIdNegocio ?? 0,
      };

      const res: ServiceResponse<DashboardVentasResponse> = await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) {
        setData((prev) => (prev ? { ...prev, rows: res.data.rows } : res.data));
      }
    } finally {
      setLoadingRows(false);
    }
  }, [usuarioNombre, desde, hasta, debouncedSearch, negocioId]);

  React.useEffect(() => {
    loadDashboard();
    loadCustomDashboard();
  }, [filterToken]);

  React.useEffect(() => {
    refreshGridRowsOnly();
  }, [debouncedSearch, refreshGridRowsOnly]);

  const kpis = React.useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "Ventas",
        value: String(data.totalVentas),
        icon: <ShoppingCartIcon sx={{ color: "#60a5fa" }} />,
      },
      {
        label: "Cobrado",
        value: fmtCurrency(data.totalCobrado),
        icon: <AttachMoneyIcon sx={{ color: "#34d399" }} />,
      },
      {
        label: "CashBack",
        value: data.puntosGenerados.toFixed(2),
        icon: <PercentIcon sx={{ color: "#a78bfa" }} />,
      },
      {
        label: "Ticket promedio",
        value: fmtCurrency(data.ticketPromedio),
        icon: <TrendingUpIcon sx={{ color: "#f59e0b" }} />,
      },
    ];
  }, [data]);

  const withinLast7Days = (iso: string) => {
    const d = dayjs(iso);
    if (!d.isValid()) return false;

    const end = (hasta ?? dayjs()).endOf("day");
    const start = end.clone().startOf("day").subtract(6, "day");

    const time = d.valueOf();
    return time >= start.valueOf() && time <= end.valueOf();
  };

  const ventasPorDia = React.useMemo(() => {
    const raw = data?.ventasPorDia ?? [];
    const filtered = raw.length === 0 ? [] : raw.filter((x) => withinLast7Days(String(x.dia)));
    return filtered.map((x, i) => ({
      dia: x.dia,
      ventas: x.ventas,
      color: SOFT_COLORS[i % SOFT_COLORS.length],
    }));
  }, [data, hasta]);

  const topArticulos = React.useMemo(() => {
    if (!data) return [];
    if (data.topArticulos?.length && (data.topArticulos as any)[0]?.unidades !== undefined) {
      return data.topArticulos
        .map((x, i) => ({
          name: x.nombre,
          qty: Number((x as any).unidades),
          color: SOFT_COLORS[i % SOFT_COLORS.length],
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
    }

    const acc = new Map<string, number>();
    for (const r of data.rows) {
      const name = r.articulo || "(Sin nombre)";
      const q = Number((r as any).cantidad ?? 1);
      acc.set(name, (acc.get(name) ?? 0) + q);
    }

    return Array.from(acc.entries())
      .map(([name, qty], i) => ({
        name,
        qty,
        color: SOFT_COLORS[i % SOFT_COLORS.length],
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [data]);

  const exportSheet = (
    sheets: { name: string; rows: any[] }[],
    fileName: string
  ) => {
    const wb = XLSX.utils.book_new();
    sheets.forEach((s) => {
      const ws = XLSX.utils.json_to_sheet(s.rows);
      XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
    });
    XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
  };

  const onExportVentasDiaXlsx = () => {
    const rows = ventasPorDia.map((r) => ({
      Día: fmtDateAxis(String(r.dia)),
      Ventas: r.ventas,
    }));
    exportSheet(
      [{ name: "Ventas_por_dia", rows }],
      `ventas_por_dia_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const onExportTopArtXlsx = () => {
    const rows = topArticulos.map((r) => ({
      Artículo: r.name,
      Cantidad: r.qty,
    }));
    exportSheet(
      [{ name: "Top_articulos", rows }],
      `top_articulos_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const onExportGridXlsx = async () => {
    try {
      if (!data?.rows?.length) {
        showToast("No hay datos para exportar.", "error");
        return;
      }
      setExportingGrid(true);
      const rows = data.rows.map((r) => ({
        Folio: r.folio,
        Artículo: r.articulo,
        Descripción: r.descripcion,
        Teléfono: (r as any).telefonoCliente ?? "",
        Monto: r.monto,
        Puntos: r.puntosGenerados,
        Cobrado: r.cobrado,
        Fecha: fmtDate(r.creadoFecha as any),
        Personalizado: isCustom((r as any).esCustom) ? "Sí" : "No",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = (ws as any)[cellAddress];
          if (!cell) continue;
          if (R === range.s.r) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFFFF" } },
              fill: { fgColor: { rgb: "2563EB" }, patternType: "solid" },
              alignment: { horizontal: "center" },
            };
          } else if (R % 2 === 0) {
            cell.s = {
              fill: { fgColor: { rgb: "F1F5F9" }, patternType: "solid" },
            };
          }
        }
      }

      XLSX.writeFile(
        wb,
        `ventas_filtradas_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast("Descarga completada con éxito.", "success");
    } catch (err) {
      console.error(err);
      showToast("Ocurrió un error al exportar.", "error");
    } finally {
      setExportingGrid(false);
    }
  };

  const { promoCombinedData, promoTopSeries, promoProductNames } =
    React.useMemo(() => {
      const result = {
        promoCombinedData: [] as any[],
        promoTopSeries: [] as { name: string; qty: number; color: string }[],
        promoProductNames: [] as string[],
      };

      if (!customData?.series?.length) return result;

      const filteredSeries = customData.series.map((s) => ({
        ...s,
        data: s.data.filter((p) => withinLast7Days(String(p.fecha))),
      }));

      const totals = new Map<string, number>();
      filteredSeries.forEach((s) => {
        const total = s.data.reduce((acc, p) => acc + p.ventas, 0);
        totals.set(s.nombreProducto, (totals.get(s.nombreProducto) ?? 0) + total);
      });

      const ranking = Array.from(totals.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => {
          if (b.qty !== a.qty) return b.qty - a.qty;
          return a.name.localeCompare(b.name, "es");
        });

      const top10 = ranking.slice(0, 10);
      const topNames = top10.map((x) => x.name);

      const allDates = new Set<string>();
      filteredSeries.forEach((s) =>
        s.data.forEach((p) => {
          if (topNames.includes(s.nombreProducto)) {
            allDates.add(String(p.fecha));
          }
        })
      );
      const datesSorted = Array.from(allDates).sort();

      const combinedRows = datesSorted.map((fecha) => {
        const row: any = { fecha };
        filteredSeries.forEach((s) => {
          if (!topNames.includes(s.nombreProducto)) return;
          const point = s.data.find((p) => String(p.fecha) === fecha);
          row[s.nombreProducto] = point?.ventas ?? 0;
        });
        return row;
      });

      const topSeriesChart = top10.map((t, i) => ({
        name: t.name,
        qty: t.qty,
        color: SOFT_COLORS[i % SOFT_COLORS.length],
      }));

      result.promoCombinedData = combinedRows;
      result.promoTopSeries = topSeriesChart;
      result.promoProductNames = top10.map((x) => x.name);

      return result;
    }, [customData, hasta]);

  const onExportPromosXlsx = () => {
    if (!customData?.series?.length) return;
    const combined = promoCombinedData.map((r) => ({
      Fecha: fmtDateAxis(String(r.fecha)),
      ...r,
    }));
    const perSeries = customData.series.map((s) => ({
      name: s.nombreProducto.slice(0, 31),
      rows: s.data.map((p) => ({
        Fecha: fmtDateAxis(String(p.fecha)),
        Ventas: p.ventas,
        Monto: p.monto,
        Canjes: p.canjes,
      })),
    }));
    exportSheet(
      [{ name: "Promociones_por_dia", rows: combined }, ...perSeries],
      `promos_custom_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const onClickDeleteRow = (row: VentaRowDto) => {
      setDeleteRow(row);
      setConfirmDeleteOpen(true);
    };

  const handleCancelConfirmDelete = () => {
    if (deleting) return;
    setConfirmDeleteOpen(false);
    setDeleteRow(null);
  };

  const handleDeleteVenta = async () => {
    if (!deleteRow) return;
    const idNegocio = typeof negocioId === "number" ? negocioId : getIdNegocioActual() ?? 0;

    const dto: DeleteVentaFromRowDto = {
      folio: Number(deleteRow.folio),
      idNegocio,
      usuarioNombre,
    };

    try {
      setDeleting(true);
      const { data } = await api.delete<ServiceResponse<boolean>>(
        "/Sell/DeleteVentaFromRow",
        { data: dto }
      );

      if (data.status === 200 && (data.data === true || data.data == null)) {
        await refreshGridRowsOnly();
        showToast(data.message || "Venta eliminada con éxito.", "success");
      } else {
        showToast(data.message || "No se pudo eliminar la venta.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error de red al eliminar la venta.", "error");
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setDeleteRow(null);
    }
  };

  const columns: GridColDef<VentaRowDto>[] = [
    { field: "folio", headerName: "Folio", width: 80, align: "center", headerAlign: "center" },
    { field: "articulo", headerName: "Artículo", minWidth: 120, flex: 1 },
    { 
      field: "descripcion", 
      headerName: "Descripción", 
      minWidth: 180, 
      flex: 1.5,
    },
    { field: "telefonoCliente", headerName: "Teléfono", width: 100 },
    
    { field: "cantidad", headerName: "Cant.", width: 70, align: "center", headerAlign: "center"},
    {
      field: "monto",
      headerName: "Monto",
      width: 100,
      align: "right",
      headerAlign: "right",
      valueFormatter: (p) => fmtCurrency(p as number),
    },
    {
      field: "cobrado",
      headerName: "Cobrado",
      width: 100,
      align: "right",
      headerAlign: "right",
      valueFormatter: (p) => fmtCurrency(p as number),
    },
    {
      field: "puntosGenerados",
      headerName: "Cashback",
      width: 90,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) => Number(p as number).toFixed(2),
    },
    {
      field: "creadoFecha",
      headerName: "Fecha",
      width: 150,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) => fmtDate(p as string),
    },
    {
      field: "esCustom",
      headerName: "Esp.",
      width: 60,
      align: "center",
      headerAlign: "center",
      sortable: true,
      renderCell: (p) =>
        isCustom(p.row.esCustom) ? (
          <MuiTooltip title="Producto personalizado" arrow>
            <AutoFixHighIcon sx={{ color: "#a78bfa", fontSize: 20 }} />
          </MuiTooltip>
        ) : null,
    },
    {
      field: "editar",
      headerName: "Editar",
      width: 70,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => {
        const custom = isCustom(p.row.esCustom);
        
        // Si es custom, mostramos un icono deshabilitado
        if (custom) {
            return (
                <MuiTooltip title="No editable (promoción)" arrow>
                    <span>
                        <IconButton size="small" disabled sx={{ opacity: 0.3 }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </span>
                </MuiTooltip>
            );
        }

        return (
          <MuiTooltip title="Editar venta" arrow>
            <IconButton
              size="small"
              onClick={() => openEditModal(p.row)}
              aria-label="Editar"
              sx={{ color: "primary.main" }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        );
      },
    },
    {
      field: "eliminar",
      headerName: "Borrar",
      width: 70,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => {
        const custom = isCustom(p.row.esCustom);
        return (
          <MuiTooltip
            title={custom ? "Eliminar promoción" : "Eliminar venta"}
            arrow
          >
            <IconButton
              size="small"
              onClick={() => onClickDeleteRow(p.row)}
              aria-label="Eliminar"
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        );
      },
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
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
              Dashboard de Ventas
            </Typography>
            <Chip icon={<ShieldIcon />} label={isSuperAdmin ? "Solo SUPER ADMIN" : "Solo ADMIN"} color="secondary" variant="outlined" size={isMobile ? "small" : "medium"} />
          </Stack>

        {/* Filtros Apilables */}
        <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            
            {/* 1. Selector de Negocio (Solo SuperAdmin) */}
            {isSuperAdmin && (
              // 'grow' hace que se expanda para llenar el espacio
              <Grid size={{ xs: 12, sm: 'grow' }}>
                <Autocomplete
                  options={negocios}
                  getOptionLabel={(o) => o?.nombre ?? ""}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  value={negocios.find((n) => n.id === negocioId) ?? null}
                  onChange={(_, newVal) => {
                    const nextId = newVal ? newVal.id : "";
                    setNegocioId(nextId);
                  }}
                  loading={loadingNegocios}
                  clearOnEscape
                  autoHighlight
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Negocio"
                      placeholder="Buscar..."
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingNegocios ? (
                              <CircularProgress size={18} sx={{ mr: 1 }} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            {/* 2. Fechas */}
            <Grid size={{ xs: 12, sm: 'grow' }}>
              <DatePicker
                label="Desde"
                value={desde}
                onChange={(v) => setDesde(v)}
                format="DD-MMM-YYYY"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 'grow' }}>
              <DatePicker
                label="Hasta"
                value={hasta}
                onChange={(v) => setHasta(v)}
                format="DD-MMM-YYYY"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* 3. Botones de Acción */}
            {/* 'auto' hace que ocupe solo el espacio necesario, no más */}
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ minWidth: 'fit-content' }}>
              <Stack direction="row" spacing={1.5} sx={{ height: '56px', alignItems: 'stretch' }}>
                <Button
                  variant="contained"
                  onClick={() => setFilterToken((x) => x + 1)}
                  disabled={loading || loadingCustom}
                  // Quitamos fullWidth, ajustamos padding y minWidth
                  sx={{ borderRadius: 1.5, px: 3, minWidth: 120, fontSize: '1rem' }}
                >
                  {loading || loadingCustom ? <CircularProgress size={24} color="inherit" /> : "Filtrar"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const d = dayjs();
                    setDesde(d.startOf("day"));
                    setHasta(d.endOf("day"));
                    setFilterToken((x) => x + 1);
                    if(isSuperAdmin) setNegocioId("");
                  }}
                  sx={{ borderRadius: 1.5, px: 3, minWidth: 100 }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>

          </Grid>
        </Paper>

        {/* KPIs Grid Responsivo */}
        {data && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
              gap: 2,
              mb: 3
            }}
          >
            {kpis.map((k, i) => (
              <Paper key={i} sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography color="text.secondary">{k.label}</Typography>
                  {k.icon}
                </Stack>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                  {k.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Gráficas con Tabs */}
        <Paper sx={{ borderRadius: 3, mb: 3 }}>
          <Tabs
            value={chartsTab}
            onChange={(_, v) => setChartsTab(v)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab label="Ventas" />
            <Tab label="Promociones" />
          </Tabs>
          <Divider />

          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", lg: "row" }} gap={2}>
                {chartsTab === 0 ? (
                    <>
                    <Paper sx={{ p: 2, flex: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography fontWeight={700} mb={2} color="primary">Ventas por día</Typography>
                        <Typography variant="caption" color="text.secondary" mb={2} display="block">Resultado por fecha (máx. 7 días)</Typography>
                        <Box sx={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ventasPorDia}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dia" tickFormatter={fmtDateAxis} tick={{fontSize: 10}} />
                                    <YAxis tick={{fontSize: 10}} />
                                    <Tooltip labelFormatter={(v) => fmtDateAxis(String(v))} />
                                    <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
                                        {ventasPorDia.map((r, i) => <Cell key={i} fill={r.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                         <Typography fontWeight={700} mb={2} color="primary">Artículos más vendidos</Typography>
                         <Typography variant="caption" color="text.secondary" mb={2} display="block">Top 10 por cantidad</Typography>
                         <Box sx={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topArticulos} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                                    <Tooltip 
                                        formatter={(value) => [value, "Cantidad"]} 
                                        labelStyle={{ color: "#333", fontWeight: "bold" }} 
                                      />
                                    <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                                        {topArticulos.map((r, i) => <Cell key={i} fill={r.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         </Box>
                    </Paper>
                    </>
                ) : (
                    <Paper sx={{ p: 2, width: '100%', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                         <Typography fontWeight={700} mb={2} color="primary">Ventas de promociones personalizadas</Typography>
                         <Typography variant="caption" color="text.secondary" mb={2} display="block">Promociones personalizadas (máx. 7 días, Top 10)</Typography>
                         <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={promoCombinedData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha" tickFormatter={fmtDateAxis} />
                                    <YAxis />
                                    <Tooltip labelFormatter={(v) => fmtDateAxis(String(v))}/>
                                    <Legend />
                                    {promoProductNames.map((name, i) => (
                                        <Bar key={name} dataKey={name} stackId="a" fill={SOFT_COLORS[i % SOFT_COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                         </Box>
                    </Paper>
                )}
            </Stack>
          </Box>
        </Paper>

        {/* Tabla de Ventas */}
        <Paper sx={{ p: 2.5, borderRadius: 3, width: '100%', overflow: 'hidden' }}>
          <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 2 }}>
            Ventas recientes
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              size="small"
              fullWidth
            />
            <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onExportGridXlsx}>
                    Exportar
                </Button>
                <IconButton onClick={refreshGridRowsOnly} color="primary">
                    <RefreshIcon />
                </IconButton>
            </Stack>
          </Stack>

          <Box sx={{ height: dynamicHeight, width: "100%", overflowX: 'auto' }}>
            <DataGrid
              rows={data?.rows ?? []}
              columns={columns}
              getRowId={(r) => r.folio}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 20, 50]}
              loading={loadingRows || (loading && !!data)}
              disableRowSelectionOnClick
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    descripcion: !isMobile,
                    telefonoCliente: !isMobile,
                    creadoFecha: !isMobile,
                  },
                },
              }}
              sx={{
                minWidth: isMobile ? 800 : '100%',
                "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Modals y Toasts */}
      <Dialog open={editOpen} onClose={closeEditModal} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Venta</DialogTitle>
          <DialogContent>
             <Stack spacing={2} mt={1}>
                <TextField label="Artículo" value={editForm.articulo} onChange={onEditChange("articulo")} />
                <TextField label="Monto" value={editForm.monto} onChange={onNumericChange("monto")} />
                <TextField label="Cantidad" value={editForm.cantidad} onChange={onNumericChange("cantidad")} />
             </Stack>
          </DialogContent>
          <DialogActions>
             <Button onClick={onCancelarEdicion}>Cancelar</Button>
             <Button variant="contained" onClick={commitEdit}>Guardar</Button>
          </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={handleCancelConfirmDelete}>
          <DialogTitle>Eliminar Venta</DialogTitle>
          <DialogContent>¿Estás seguro? Esta acción es irreversible.</DialogContent>
          <DialogActions>
              <Button onClick={handleCancelConfirmDelete}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleDeleteVenta}>Eliminar</Button>
          </DialogActions>
      </Dialog>

{/* TOAST PERSONALIZADO */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        // Posición: Arriba a la Derecha
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          // variant="filled" es la clave para que se vea con color sólido
          variant="filled" 
          sx={{
            width: "100%",
            boxShadow: 3, // Sombra para que resalte
            fontSize: '0.95rem',
            // Forzamos el color verde específico si es success
            ...(toastSeverity === 'success' && {
                bgcolor: '#2e7d32', // Verde Material Design
                color: '#fff'
            })
          }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>

    </LocalizationProvider>
  );
}