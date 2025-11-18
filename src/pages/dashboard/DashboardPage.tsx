// src/pages/dashboard/DashboardPage.tsx
import * as React from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Divider,
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

// Date pickers (MUI X) + dayjs
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

// ===== DTO local para actualizar (evita errores si aún no tienes el archivo de tipos) =====
type UpdateVentaFromRowDto = {
  folio: number;
  articulo: string;
  descripcion: string;
  monto: number;
  cantidad: number;
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

// Para la columna de fecha del grid (fecha + hora:minuto)
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

// Para ejes X de gráficas (12-nov-2025)
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

// Normaliza truthy para esCustom (boolean/string/num)
const isCustom = (v: any) =>
  v === true || v === 1 || String(v).toLowerCase() === "true";

/* ============ Componente principal ============ */
export default function DashboardPage() {
  const usuarioNombre = localStorage.getItem("pa_user") || "";
  const role = (localStorage.getItem("pa_role") || "").toLowerCase();
  const isSuperAdmin = role === "superadmin";

  // Filtros con DatePicker (Dayjs)
  const [desde, setDesde] = React.useState<Dayjs | null>(
    dayjs().startOf("day")
  );
  const [hasta, setHasta] = React.useState<Dayjs | null>(
    dayjs().endOf("day")
  );

  // SUPERADMIN: dropdown de negocios
  const [negocios, setNegocios] = React.useState<NegocioOption[]>([]);
  const [loadingNegocios, setLoadingNegocios] = React.useState(false);
  const [negocioId, setNegocioId] = React.useState<number | "">("");

  // pestañas SOLO para gráficas
  const [chartsTab, setChartsTab] = React.useState<0 | 1>(0);

  // token para aplicar filtros manualmente (solo recarga al dar click en "Filtrar")
  const [filterToken, setFilterToken] = React.useState(1);

  // Datos normales
  const [data, setData] = React.useState<DashboardVentasResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Datos personalizadas
  const [customData, setCustomData] =
    React.useState<DashboardVentasCustomResponse | null>(null);
  const [loadingCustom, setLoadingCustom] = React.useState(false);
  const [errorCustom, setErrorCustom] = React.useState<string | null>(null);

  // Grid: paginación, búsqueda y loading local (solo filas)
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
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

  // Refs para capturar las gráficas
  const ventasDiaRef = React.useRef<HTMLDivElement>(null);
  const topArtRef = React.useRef<HTMLDivElement>(null);
  const promoChartRef = React.useRef<HTMLDivElement>(null);

  // ======= MODAL DE EDICIÓN =======
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  type EditForm = {
    folio: number;
    articulo: string;
    descripcion: string;
    monto: string; // string para facilitar validación
    cantidad: string;
  };

  const [editForm, setEditForm] = React.useState<EditForm>({
    folio: 0,
    articulo: "",
    descripcion: "",
    monto: "",
    cantidad: "",
  });

  // Snapshot para poder revertir al cancelar
  const [editInitialForm, setEditInitialForm] =
    React.useState<EditForm | null>(null);

  // ===== Toasts =====
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] =
    React.useState<"success" | "error">("success");

  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  // ===== Export grid =====
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

  const onEditChange =
    (key: "articulo" | "descripcion" | "monto" | "cantidad") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditForm((f) => ({ ...f, [key]: e.target.value }));
    };

  // === Sólo números con hasta 2 decimales (coma se normaliza a punto)
  const onNumericChange =
    (key: "monto" | "cantidad") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const idNegocio =
      typeof negocioId === "number" ? negocioId : getIdNegocioActual() ?? 0;

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
      setEditError(
        "El monto debe ser un número mayor a 0 y con máximo 2 decimales."
      );
      return;
    }
    if (!(Number.isFinite(cantidad) && cantidad > 0)) {
      setEditError(
        "La cantidad debe ser un número mayor a 0 y con máximo 2 decimales."
      );
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

  // Cancelar: revierte y cierra
  const onCancelarEdicion = () => {
    if (editSaving) return;
    if (editInitialForm) setEditForm(editInitialForm);
    setEditOpen(false);
  };

  // Cargar negocios (solo superadmin)
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

  // Cargar dashboard normal (KPIs, charts, grid completo)
  const loadDashboard = async (overrideIdNegocio?: number | "") => {
    setLoading(true);
    setError(null);
    try {
      const selectedIdNegocio =
        typeof overrideIdNegocio === "number"
          ? overrideIdNegocio
          : typeof negocioId === "number"
          ? negocioId
          : getIdNegocioActual();

      const req: DashboardVentasRequest = {
        usuarioNombre,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
        page: 1,
        pageSize: 100,
        search: debouncedSearch || null,
        idNegocio: selectedIdNegocio ?? 0,
      };

      const res: ServiceResponse<DashboardVentasResponse> =
        await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) setData(res.data);
      else setError(res.message || "Error al obtener las ventas");
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Cargar dashboard de promociones
  const loadCustomDashboard = async (overrideIdNegocio?: number | "") => {
    setLoadingCustom(true);
    setErrorCustom(null);
    try {
      const selectedIdNegocio =
        typeof overrideIdNegocio === "number"
          ? overrideIdNegocio
          : typeof negocioId === "number"
          ? negocioId
          : getIdNegocioActual();

      const req: DashboardVentasCustomRequest = {
        idNegocio: selectedIdNegocio ?? 0,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
      };

      const res = await sellService.getVentasCustomDashboard(req);
      if (res.status === 200 && res.data) setCustomData(res.data);
      else
        setErrorCustom(
          res.message || "Error al obtener las ventas personalizadas"
        );
    } catch (err: any) {
      setErrorCustom(err.message ?? "Error inesperado al cargar promociones");
    } finally {
      setLoadingCustom(false);
    }
  };

  // Refrescar SOLO las filas del grid, manteniendo KPIs y gráficas
  const refreshGridRowsOnly = React.useCallback(async () => {
    try {
      setLoadingRows(true);
      const selectedIdNegocio =
        typeof negocioId === "number" ? negocioId : getIdNegocioActual();

      const req: DashboardVentasRequest = {
        usuarioNombre,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
        page: 1,
        pageSize: 100,
        search: debouncedSearch || null,
        idNegocio: selectedIdNegocio ?? 0,
      };

      const res: ServiceResponse<DashboardVentasResponse> =
        await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) {
        setData((prev) => (prev ? { ...prev, rows: res.data.rows } : res.data));
      }
    } finally {
      setLoadingRows(false);
    }
  }, [usuarioNombre, desde, hasta, debouncedSearch, negocioId]);

  // Cargar al iniciar y cuando cambia el "filterToken"
  React.useEffect(() => {
    loadDashboard();
    loadCustomDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterToken]);

  // KPIs
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
        label: "Puntos generados",
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

  // Columnas del grid (se agrega la de Editar al final)
  const columns: GridColDef<VentaRowDto>[] = [
    { field: "folio", headerName: "Folio", width: 80 },
    { field: "articulo", headerName: "Artículo", width: 140 },
    { field: "descripcion", headerName: "Descripción", flex: 1, minWidth: 160 },
    { field: "telefonoCliente", headerName: "Teléfono", width: 100 },
    {
      field: "monto",
      headerName: "Monto",
      width: 140,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) => fmtCurrency(p as number),
    },
    {
      field: "puntosGenerados",
      headerName: "Puntos",
      width: 120,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) => Number(p as number).toFixed(2),
    },
    {
      field: "cobrado",
      headerName: "Cobrado",
      width: 140,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) => fmtCurrency(p as number),
    },
    {
      field: "creadoFecha",
      headerName: "Fecha",
      width: 150,
      valueFormatter: (p) => fmtDate(p as string),
    },
    {
      field: "esCustom",
      headerName: "Especial",
      width: 100,
      align: "center",
      headerAlign: "center",
      sortable: true,
      renderCell: (p) =>
        isCustom(p.row.esCustom) ? (
          <MuiTooltip title="Producto personalizado" arrow>
            <AutoFixHighIcon sx={{ color: "#a78bfa" }} />
          </MuiTooltip>
        ) : null,
    },
    {
      field: "editar",
      headerName: "Editar",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => {
        const custom = isCustom(p.row.esCustom);
        return (
          <MuiTooltip
            title={custom ? "No editable (personalizado)" : "Editar venta"}
            arrow
          >
            <span>
              <IconButton
                size="small"
                onClick={() => !custom && openEditModal(p.row)}
                aria-label="Editar"
                sx={{ color: "primary.main" }}
                disabled={custom}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </MuiTooltip>
        );
      },
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  // ==== Helper: limitar a máx. 7 días hacia atrás desde "hasta" ====
  const withinLast7Days = (iso: string) => {
    const d = dayjs(iso);
    if (!d.isValid()) return false;

    const end = (hasta ?? dayjs()).endOf("day"); // fecha Hasta (fin del día)
    const start = end.clone().startOf("day").subtract(6, "day"); // 7 días hacia atrás

    const time = d.valueOf();
    return time >= start.valueOf() && time <= end.valueOf();
  };

  // Series normales (ventas por día -> BARRAS)
  const ventasPorDia = React.useMemo(() => {
    const raw = data?.ventasPorDia ?? [];
    const filtered =
      raw.length === 0
        ? []
        : raw.filter((x) => withinLast7Days(String(x.dia)));

    return filtered.map((x, i) => ({
      dia: x.dia,
      ventas: x.ventas,
      color: SOFT_COLORS[i % SOFT_COLORS.length],
    }));
  }, [data, hasta]);

  // Top artículos (Top 10)
  const topArticulos = React.useMemo(() => {
    if (!data) return [];
    if (
      data.topArticulos?.length &&
      (data.topArticulos as any)[0]?.unidades !== undefined
    ) {
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

  /* ================== EXPORT HELPERS ================== */
  // Excel (genérico)
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

  // Excel: Ventas por día
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

  // Excel: Top artículos
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

  // Excel: Grid de ventas filtrado
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

      // Estilos simples (encabezado + zebra) – se castea a any
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = (ws as any)[cellAddress];
          if (!cell) continue;
          if (R === range.s.r) {
            // header
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFFFF" } },
              fill: { fgColor: { rgb: "2563EB" }, patternType: "solid" },
              alignment: { horizontal: "center" },
            };
          } else if (R % 2 === 0) {
            // zebra
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

  // PNG (genérico)
  const savePng = async (ref: React.RefObject<HTMLElement>, name: string) => {
    if (!ref.current) return;
    const dataUrl = await htmlToImage.toPng(ref.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    const link = document.createElement("a");
    link.download = name.endsWith(".png") ? name : `${name}.png`;
    link.href = dataUrl;
    link.click();
  };

  // SVG
  const saveSvg = (ref: React.RefObject<HTMLElement>, name: string) => {
    if (!ref.current) return;
    const svg = ref.current.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("style", "background:#ffffff;");
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = name.endsWith(".svg") ? name : `${name}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ===== Promociones: combinada por día (máx. 7 días, top 10 promos) =====
  const { promoCombinedData, promoTopSeries, promoProductNames } =
    React.useMemo(() => {
      const result = {
        promoCombinedData: [] as any[],
        promoTopSeries: [] as { name: string; qty: number; color: string }[],
        promoProductNames: [] as string[],
      };

      if (!customData?.series?.length) return result;

      // Filtrar puntos por última semana
      const filteredSeries = customData.series.map((s) => ({
        ...s,
        data: s.data.filter((p) => withinLast7Days(String(p.fecha))),
      }));

      // Totales por promoción
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

      // Fechas únicas
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box className="space-y-4">
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h5" fontWeight={800} color="primary">
              Dashboard de Ventas
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              Filtra por fecha, negocio (solo SuperAdmin) y busca en tus ventas
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <MuiTooltip title="Refrescar (manteniendo filtros)" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  setFilterToken((x) => x + 1);
                }}
                aria-label="Refrescar"
                sx={{
                  ml: 1,
                  color: "primary.main",
                  "&:hover": { color: "primary.dark" },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>
        </Stack>

        {/* Filtros */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            {isSuperAdmin && (
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
                includeInputInList
                sx={{
                  minWidth: { sm: 320 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Negocio"
                    placeholder="Escribe para buscar…"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingNegocios ? (
                            <CircularProgress
                              color="inherit"
                              size={18}
                              sx={{ mr: 1 }}
                            />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}

            <DatePicker
              label="Desde"
              value={desde}
              onChange={(v) => setDesde(v)}
              format="DD-MMM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                },
              }}
            />
            <DatePicker
              label="Hasta"
              value={hasta}
              onChange={(v) => setHasta(v)}
              format="DD-MMM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                },
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={() => {
                  // solo cuando se da click se recarga todo
                  setFilterToken((x) => x + 1);
                }}
                disabled={loading || loadingCustom}
                sx={{ borderRadius: 2, px: 3 }}
              >
                {loading || loadingCustom ? (
                  <CircularProgress size={20} />
                ) : (
                  "Filtrar"
                )}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const d = dayjs();
                  setDesde(d.startOf("day"));
                  setHasta(d.endOf("day"));
                  setFilterToken((x) => x + 1);
                }}
                sx={{ borderRadius: 2 }}
              >
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* KPIs */}
        {data && (
          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            {kpis.map((k, i) => (
              <Paper key={i} sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography color="text.secondary">{k.label}</Typography>
                  {k.icon}
                </Stack>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                  {k.value}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}

        {/* ======== SOLO GRÁFICAS con TABS ======== */}
        <Paper sx={{ borderRadius: 3 }}>
          <Tabs
            value={chartsTab}
            onChange={(_, v) => setChartsTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ px: 2 }}
          >
            <Tab label="Ventas" />
            <Tab label="Ventas Promociones" />
          </Tabs>
          <Divider />

          <Box sx={{ p: 2 }}>
            {chartsTab === 0 ? (
              <Stack direction={{ xs: "column", lg: "row" }} gap={2}>
                {/* Ventas por día */}
                <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <div>
                      <Typography fontWeight={800} color="primary">
                        Ventas por día
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Últimos resultados por fecha (máx. 7 días)
                      </Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <MuiTooltip title="Excel (datos de la gráfica)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={onExportVentasDiaXlsx}
                          sx={niceBtn()}
                        >
                          Excel
                        </Button>
                      </MuiTooltip>
                      <MuiTooltip title="PNG (imagen de la gráfica)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => savePng(ventasDiaRef, "ventas_por_dia")}
                          sx={niceBtn()}
                        >
                          PNG
                        </Button>
                      </MuiTooltip>
                      <MuiTooltip title="SVG (vector editable)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PolylineIcon />}
                          onClick={() => saveSvg(ventasDiaRef, "ventas_por_dia")}
                          sx={niceBtn()}
                        >
                          SVG
                        </Button>
                      </MuiTooltip>
                    </Stack>
                  </Stack>

                  <Box
                    ref={ventasDiaRef}
                    sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}
                  >
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ventasPorDia}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="dia"
                            tickFormatter={fmtDateAxis}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(v) => fmtDateAxis(String(v))}
                          />
                          <Bar dataKey="ventas" radius={[6, 6, 0, 0]}>
                            {ventasPorDia.map((row, i) => (
                              <Cell key={i} fill={row.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>

                {/* Top artículos */}
                <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <div>
                      <Typography fontWeight={800} color="primary">
                        Artículos más vendidos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Top 10 por cantidad
                      </Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <MuiTooltip title="Excel (datos de la gráfica)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={onExportTopArtXlsx}
                          sx={niceBtn()}
                        >
                          Excel
                        </Button>
                      </MuiTooltip>
                      <MuiTooltip title="PNG (imagen de la gráfica)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => savePng(topArtRef, "top_articulos")}
                          sx={niceBtn()}
                        >
                          PNG
                        </Button>
                      </MuiTooltip>
                      <MuiTooltip title="SVG (vector editable)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PolylineIcon />}
                          onClick={() => saveSvg(topArtRef, "top_articulos")}
                          sx={niceBtn()}
                        >
                          SVG
                        </Button>
                      </MuiTooltip>
                    </Stack>
                  </Stack>

                  <Box
                    ref={topArtRef}
                    sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}
                  >
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topArticulos}
                          margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip
                            formatter={(v: any) => [Number(v).toFixed(2)]}
                          />
                          <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                            {topArticulos.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>
              </Stack>
            ) : (
              // TAB: Ventas Promociones
              <Stack direction={{ xs: "column", lg: "row" }} gap={2}>
                {/* Ventas de promociones por día */}
                <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <div>
                      <Typography fontWeight={800} color="primary">
                        Ventas de promociones personalizadas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cada color representa una promoción personalizada
                        (máx. 7 días, Top 10)
                      </Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <MuiTooltip
                        title="Excel (datos de las promociones)"
                        arrow
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={onExportPromosXlsx}
                          sx={niceBtn()}
                        >
                          Excel
                        </Button>
                      </MuiTooltip>
                      <MuiTooltip title="PNG (imagen de la gráfica)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => savePng(promoChartRef, "promos_por_dia")}
                          sx={niceBtn()}
                        >
                          PNG
                        </Button>
                      </MuiTooltip>
                      <MuiTooltip title="SVG (vector editable)" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PolylineIcon />}
                          onClick={() => saveSvg(promoChartRef, "promos_por_dia")}
                          sx={niceBtn()}
                        >
                          SVG
                        </Button>
                      </MuiTooltip>
                    </Stack>
                  </Stack>

                  <Box
                    ref={promoChartRef}
                    sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}
                  >
                    {errorCustom && (
                      <Typography color="error" mb={1}>
                        {errorCustom}
                      </Typography>
                    )}
                    {loadingCustom ? (
                      <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <Box sx={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={promoCombinedData}
                            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="fecha"
                              tickFormatter={(v) => fmtDateAxis(String(v))}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(v) =>
                                fmtDateAxis(String(v))
                              }
                            />
                            <Legend />
                            {promoProductNames.map((name, i) => (
                              <Bar
                                key={name}
                                dataKey={name}
                                stackId="ventas"
                                radius={[6, 6, 0, 0]}
                                fill={SOFT_COLORS[i % SOFT_COLORS.length]}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {/* Top promociones */}
                <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <div>
                      <Typography fontWeight={800} color="primary">
                        Top promociones personalizadas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Top 10 por cantidad vendida
                      </Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <MuiTooltip
                        title="Excel (Top promociones personalizadas)"
                        arrow
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={onExportPromosXlsx}
                          sx={niceBtn()}
                        >
                          Excel
                        </Button>
                      </MuiTooltip>
                    </Stack>
                  </Stack>

                  <Box sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={promoTopSeries}
                          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                            {promoTopSeries.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>
              </Stack>
            )}
          </Box>
        </Paper>

        {/* ========= Tabla ========= */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          {/* Título como en "Promociones del negocio" */}
          <Typography
            variant="h6"
            fontWeight={800}
            color="primary"
            sx={{ mb: 1 }}
          >
            Ventas recientes
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* Buscador + acciones debajo de la línea */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ mb: 2, maxWidth: 900 }}
          >
            <TextField
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPaginationModel((m) => ({ ...m, page: 0 }));
              }}
              placeholder="Buscar por folio, artículo, descripción, monto, puntos o cobrado…"
              size="small"
              fullWidth
              InputProps={
                {
                  startAdornment: (
                    <SearchIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "text.disabled" }}
                    />
                  ),
                  sx: { borderRadius: 20, height: 44 },
                } as any
              }
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <MuiTooltip title="Exportar a Excel (según filtros)" arrow>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      exportingGrid ? (
                        <CircularProgress size={14} />
                      ) : (
                        <DownloadIcon />
                      )
                    }
                    disabled={exportingGrid || !data?.rows?.length}
                    onClick={onExportGridXlsx}
                    sx={niceBtn()}
                  >
                    Excel
                  </Button>
                </span>
              </MuiTooltip>
              <MuiTooltip title="Refrescar tabla" arrow>
                <IconButton
                  size="small"
                  onClick={refreshGridRowsOnly}
                  sx={{
                    color: "primary.main",
                    "&:hover": { color: "primary.dark" },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </MuiTooltip>
            </Stack>
          </Stack>

          {error && (
            <Typography color="error" mb={2}>
              {error}
            </Typography>
          )}

          {loading && !data ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: dynamicHeight, width: "100%" }}>
              <DataGrid
                rows={data?.rows ?? []}
                columns={columns}
                getRowId={(r) => r.folio}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                disableRowSelectionOnClick
                pageSizeOptions={[5, 10, 20, 50]}
                loading={loadingRows || (loading && !!data)}
                sx={{
                  borderRadius: 3,
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "action.hover",
                    fontWeight: 700,
                  },
                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor: "#ffffff",
                  },
                  "& .MuiDataGrid-row:nth-of-type(odd)": {
                    backgroundColor: "rgba(14,165,233,0.06)",
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(14,165,233,0.12) !important",
                  },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within":
                    { outline: "none" },
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      {/* ===== Modal de edición ===== */}
      <Dialog open={editOpen} onClose={closeEditModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "primary.main" }}>
          Editar venta
        </DialogTitle>
        <DialogContent dividers>
          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={2}
            sx={{ mt: 1 }}
          >
            <TextField label="Folio" fullWidth value={editForm.folio} disabled />
            <TextField
              label="Artículo "
              fullWidth
              value={editForm.articulo}
              onChange={onEditChange("articulo")}
              required
            />
          </Stack>

          <TextField
            label="Descripción"
            fullWidth
            sx={{ mt: 2 }}
            value={editForm.descripcion}
            onChange={onEditChange("descripcion")}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={2}
            sx={{ mt: 2 }}
          >
            <TextField
              label="Monto "
              fullWidth
              inputMode="decimal"
              value={editForm.monto}
              onChange={onNumericChange("monto")}
              placeholder="Ej. 55.00"
              inputProps={{ pattern: "^[0-9]+(\\.[0-9]{0,2})?$" }}
              required
            />
            <TextField
              label="Cantidad"
              fullWidth
              inputMode="decimal"
              value={editForm.cantidad}
              onChange={onNumericChange("cantidad")}
              placeholder="Ej. 1"
              inputProps={{ pattern: "^[0-9]+(\\.[0-9]{0,2})?$" }}
              required
            />
          </Stack>

          {!!editError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {editError}
            </Typography>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Solo se modificarán Artículo, Descripción, Monto y Cantidad. Los
            puntos y el total cobrado se recalculan automáticamente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            startIcon={<CancelIcon />}
            variant="outlined"
            color="warning"
            onClick={onCancelarEdicion}
            disabled={editSaving}
          >
            Cancelar edición
          </Button>
          <Button
            variant="contained"
            onClick={commitEdit}
            disabled={editSaving}
            startIcon={
              editSaving ? <CircularProgress size={16} /> : undefined
            }
          >
            {editSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2200}
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
    </LocalizationProvider>
  );
}
