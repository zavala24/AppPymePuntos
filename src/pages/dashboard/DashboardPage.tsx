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
  DashboardVentasCustomSeries,
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";

import { api } from "@/infrastructure/http/api";

const sellService = new SellService(new SellRepository());

function getIdNegocioActual(): number | undefined {
  // 1) Primero intentamos el LS directo
  const ls = localStorage.getItem("pa_idNegocio");
  if (ls && !Number.isNaN(Number(ls))) return Number(ls);

  // 2) Si no, del JWT
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
  return d.toLocaleString("es-MX", { dateStyle: "medium" });
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

/* ============ Componente principal ============ */
export default function DashboardPage() {
  const usuarioNombre = localStorage.getItem("pa_user") || "";
  const role = (localStorage.getItem("pa_role") || "").toLowerCase();
  const isSuperAdmin = role === "superadmin";

  // Filtros con DatePicker (Dayjs) -> HOY–HOY por defecto
  const [desde, setDesde] = React.useState<Dayjs | null>(dayjs().startOf("day"));
  const [hasta, setHasta] = React.useState<Dayjs | null>(dayjs().endOf("day"));

  // SUPERADMIN: dropdown de negocios
  const [negocios, setNegocios] = React.useState<NegocioOption[]>([]);
  const [loadingNegocios, setLoadingNegocios] = React.useState(false);
  const [negocioId, setNegocioId] = React.useState<number | "">("");

  // ====== pestañas SOLO para gráficas
  const [chartsTab, setChartsTab] = React.useState<0 | 1>(0); // 0 = Ventas, 1 = Ventas Promociones

  // Datos normales
  const [data, setData] = React.useState<DashboardVentasResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Datos personalizadas
  const [customData, setCustomData] = React.useState<DashboardVentasCustomResponse | null>(null);
  const [loadingCustom, setLoadingCustom] = React.useState(false);
  const [errorCustom, setErrorCustom] = React.useState<string | null>(null);

  // Grid: paginación y búsqueda
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 5,
    });
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce del search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Refs para capturar las gráficas
  const ventasDiaRef = React.useRef<HTMLDivElement>(null);
  const topArtRef = React.useRef<HTMLDivElement>(null);
  const promoChartRef = React.useRef<HTMLDivElement>(null);

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

  // Cargar dashboard normal
  const loadDashboard = React.useCallback(
    async (overrideIdNegocio?: number | "") => {
      setLoading(true);
      setError(null);
      try {
        const selectedIdNegocio =
          typeof overrideIdNegocio === "number"
            ? overrideIdNegocio
            : typeof negocioId === "number"
            ? negocioId
            : getIdNegocioActual(); // 👈 fallback real

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
    },
    [usuarioNombre, desde, hasta, debouncedSearch, negocioId]
  );

  // Cargar dashboard de promociones
  const loadCustomDashboard = React.useCallback(
    async (overrideIdNegocio?: number | "") => {
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
        else setErrorCustom(res.message || "Error al obtener las ventas personalizadas");
      } catch (err: any) {
        setErrorCustom(err.message ?? "Error inesperado al cargar promociones");
      } finally {
        setLoadingCustom(false);
      }
    },
    [desde, hasta, negocioId]
  );

  // Cargar al iniciar y cuando cambian filtros
  React.useEffect(() => {
    loadDashboard();
    loadCustomDashboard();
  }, [loadDashboard, loadCustomDashboard]);

  // KPIs
  const kpis = React.useMemo(() => {
    if (!data) return [];
    return [
      { label: "Ventas", value: String(data.totalVentas), icon: <ShoppingCartIcon sx={{ color: "#60a5fa" }} /> },
      { label: "Cobrado", value: fmtCurrency(data.totalCobrado), icon: <AttachMoneyIcon sx={{ color: "#34d399" }} /> },
      { label: "Puntos generados", value: data.puntosGenerados.toFixed(2), icon: <PercentIcon sx={{ color: "#a78bfa" }} /> },
      { label: "Ticket promedio", value: fmtCurrency(data.ticketPromedio), icon: <TrendingUpIcon sx={{ color: "#f59e0b" }} /> },
    ];
  }, [data]);

  // Grid
  const columns: GridColDef<VentaRowDto>[] = [
    { field: "folio", headerName: "Folio", width: 110 },
    { field: "articulo", headerName: "Artículo", width: 140 },
    { field: "descripcion", headerName: "Descripción", flex: 1, minWidth: 160 },
    { field: "monto", headerName: "Monto", width: 140, align: "center", headerAlign: "center",
      valueFormatter: (p) => fmtCurrency(p as number) },
    { field: "puntosGenerados", headerName: "Puntos", width: 120, align: "center", headerAlign: "center",
      valueFormatter: (p) => Number(p as number).toFixed(2) },
    { field: "cobrado", headerName: "Cobrado", width: 140, align: "center", headerAlign: "center",
      valueFormatter: (p) => fmtCurrency(p as number) },
    { field: "creadoFecha", headerName: "Fecha", width: 160, valueFormatter: (p) => fmtDate(p as string) },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  // Series normales (ventas por día -> BARRAS)
  const ventasPorDia =
    data?.ventasPorDia?.map((x, i) => ({
      dia: x.dia,
      ventas: x.ventas,
      color: SOFT_COLORS[i % SOFT_COLORS.length],
    })) ?? [];

  // Top artículos
  const topArticulos = React.useMemo(() => {
    if (!data) return [];
    if (data.topArticulos?.length && (data.topArticulos as any)[0]?.unidades !== undefined) {
      return data.topArticulos.map((x, i) => ({
        name: x.nombre,
        qty: Number((x as any).unidades),
        color: SOFT_COLORS[i % SOFT_COLORS.length],
      }));
    }
    const acc = new Map<string, number>();
    for (const r of data.rows) {
      const name = r.articulo || "(Sin nombre)";
      const q = Number((r as any).cantidad ?? 1);
      acc.set(name, (acc.get(name) ?? 0) + q);
    }
    return Array.from(acc.entries())
      .map(([name, qty], i) => ({ name, qty, color: SOFT_COLORS[i % SOFT_COLORS.length] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [data]);

  /* ================== EXPORT HELPERS ================== */
  // Excel (genérico)
  const exportSheet = (sheets: { name: string; rows: any[] }[], fileName: string) => {
    const wb = XLSX.utils.book_new();
    sheets.forEach((s) => {
      const ws = XLSX.utils.json_to_sheet(s.rows);
      XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
    });
    XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
  };

  // Excel: Ventas por día
  const onExportVentasDiaXlsx = () => {
    const rows = ventasPorDia.map((r) => ({ Dia: r.dia, Ventas: r.ventas }));
    exportSheet(
      [{ name: "Ventas_por_dia", rows }],
      `ventas_por_dia_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Excel: Top artículos
  const onExportTopArtXlsx = () => {
    const rows = topArticulos.map((r) => ({ Articulo: r.name, Cantidad: r.qty }));
    exportSheet(
      [{ name: "Top_articulos", rows }],
      `top_articulos_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // PNG (genérico)
  const savePng = async (ref: React.RefObject<HTMLElement>, name: string) => {
    if (!ref.current) return;
    const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
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

  // ===== Promociones: dataset combinado por día (para barras apiladas)
  const promoCombinedData = React.useMemo(() => {
    if (!customData?.series?.length) return [];
    const allDates = new Set<string>();
    customData.series.forEach((s) => s.data.forEach((p) => allDates.add(String(p.fecha))));
    const datesSorted = Array.from(allDates).sort();
    return datesSorted.map((fecha) => {
      const row: any = { fecha };
      customData.series.forEach((s) => {
        const point = s.data.find((p) => String(p.fecha) === fecha);
        row[s.nombreProducto] = point?.ventas ?? 0;
      });
      return row;
    });
  }, [customData]);

  const productNames = (customData?.series ?? []).map((s) => s.nombreProducto);

  const onExportPromosXlsx = () => {
    if (!customData?.series?.length) return;
    const combined = promoCombinedData.map((r) => ({ ...r }));
    const perSeries = customData.series.map((s) => ({
      name: s.nombreProducto.slice(0, 31),
      rows: s.data.map((p) => ({ Fecha: p.fecha, Ventas: p.ventas, Monto: p.monto, Canjes: p.canjes })),
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
            <MuiTooltip title="Refrescar" arrow>
              <IconButton
                size="small"
                onClick={() => { loadDashboard(); loadCustomDashboard(); }}
                aria-label="Refrescar"
                sx={{ ml: 1, color: "primary.main", "&:hover": { color: "primary.dark" } }}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>
        </Stack>

        {/* Filtros */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
            {isSuperAdmin && (
              <Autocomplete
                options={negocios}
                getOptionLabel={(o) => o?.nombre ?? ""}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                value={negocios.find((n) => n.id === negocioId) ?? null}
                onChange={(_, newVal) => {
                  const nextId = newVal ? newVal.id : "";
                  setNegocioId(nextId);
                  loadDashboard(nextId);
                  loadCustomDashboard(nextId);
                }}
                loading={loadingNegocios}
                clearOnEscape
                autoHighlight
                includeInputInList
                sx={{ minWidth: { sm: 320 }, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
                          {loadingNegocios ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : null}
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
              slotProps={{ textField: { fullWidth: true, sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } } } }}
            />
            <DatePicker
              label="Hasta"
              value={hasta}
              onChange={(v) => setHasta(v)}
              slotProps={{ textField: { fullWidth: true, sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } } } }}
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={() => { loadDashboard(); loadCustomDashboard(); }}
                disabled={loading || loadingCustom}
                sx={{ borderRadius: 2, px: 3 }}
              >
                {(loading || loadingCustom) ? <CircularProgress size={20} /> : "Filtrar"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const d = dayjs();
                  setDesde(d.startOf("day"));
                  setHasta(d.endOf("day"));
                  loadDashboard();
                  loadCustomDashboard();
                }}
                sx={{ borderRadius: 2 }}
              >
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* KPIs SIEMPRE visibles */}
        {data && (
          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            {kpis.map((k, i) => (
              <Paper key={i} sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                {/* Ventas por día (BARRAS con color) */}
                <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <div>
                      <Typography fontWeight={800} color="primary">Ventas por día</Typography>
                      <Typography variant="caption" color="text.secondary">Últimos resultados por fecha</Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <MuiTooltip title="Excel (datos de la gráfica)" arrow>
                        <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                                onClick={onExportVentasDiaXlsx} sx={niceBtn()}>Excel</Button>
                      </MuiTooltip>
                      <MuiTooltip title="PNG (imagen de la gráfica)" arrow>
                        <Button variant="outlined" size="small" startIcon={<ImageIcon />}
                                onClick={() => savePng(ventasDiaRef, "ventas_por_dia")} sx={niceBtn()}>PNG</Button>
                      </MuiTooltip>
                      <MuiTooltip title="SVG (vector editable)" arrow>
                        <Button variant="outlined" size="small" startIcon={<PolylineIcon />}
                                onClick={() => saveSvg(ventasDiaRef, "ventas_por_dia")} sx={niceBtn()}>SVG</Button>
                      </MuiTooltip>
                    </Stack>
                  </Stack>

                  <Box ref={ventasDiaRef} sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ventasPorDia} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" />
                          <YAxis />
                          <Tooltip />
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
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <div>
                      <Typography fontWeight={800} color="primary">Artículos más vendidos</Typography>
                      <Typography variant="caption" color="text.secondary">Top por cantidad</Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                      <MuiTooltip title="Excel (datos de la gráfica)" arrow>
                        <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                                onClick={onExportTopArtXlsx} sx={niceBtn()}>Excel</Button>
                      </MuiTooltip>
                      <MuiTooltip title="PNG (imagen de la gráfica)" arrow>
                        <Button variant="outlined" size="small" startIcon={<ImageIcon />}
                                onClick={() => savePng(topArtRef, "top_articulos")} sx={niceBtn()}>PNG</Button>
                      </MuiTooltip>
                      <MuiTooltip title="SVG (vector editable)" arrow>
                        <Button variant="outlined" size="small" startIcon={<PolylineIcon />}
                                onClick={() => saveSvg(topArtRef, "top_articulos")} sx={niceBtn()}>SVG</Button>
                      </MuiTooltip>
                    </Stack>
                  </Stack>

                  <Box ref={topArtRef} sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}>
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topArticulos} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip formatter={(v: any) => [Number(v).toFixed(2)]} />
                          <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                            {topArticulos.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Paper>
              </Stack>
            ) : (
              // TAB: Ventas Promociones (BARRAS APILADAS)
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <div>
                    <Typography fontWeight={800} color="primary">
                      Ventas de promociones personalizadas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cada color representa una promoción personalizada
                    </Typography>
                  </div>
                  <Stack direction="row" spacing={1}>
                    <MuiTooltip title="Excel (datos de las series)" arrow>
                      <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                              onClick={onExportPromosXlsx} sx={niceBtn()}>Excel</Button>
                    </MuiTooltip>
                    <MuiTooltip title="PNG (imagen de la gráfica)" arrow>
                      <Button variant="outlined" size="small" startIcon={<ImageIcon />}
                              onClick={() => savePng(promoChartRef, "promos_por_dia")} sx={niceBtn()}>PNG</Button>
                    </MuiTooltip>
                    <MuiTooltip title="SVG (vector editable)" arrow>
                      <Button variant="outlined" size="small" startIcon={<PolylineIcon />}
                              onClick={() => saveSvg(promoChartRef, "promos_por_dia")} sx={niceBtn()}>SVG</Button>
                    </MuiTooltip>
                  </Stack>
                </Stack>

                <Box ref={promoChartRef} sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}>
                  {errorCustom && <Typography color="error" mb={1}>{errorCustom}</Typography>}
                  {loadingCustom ? (
                    <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
                  ) : (
                    <Box sx={{ height: 340 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={promoCombinedData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {productNames.map((name, i) => (
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
            )}
          </Box>
        </Paper>

        {/* ========= Tabla (siempre visible) ========= */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            sx={{ mb: 1 }}
            spacing={2}
          >
            <Typography variant="h6" fontWeight={800} color="primary">
              Ventas recientes
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", maxWidth: 560 }}>
              <TextField
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPaginationModel((m) => ({ ...m, page: 0 })); }}
                placeholder="Buscar por folio, artículo, descripción, monto, puntos o cobrado…"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} />,
                  sx: { borderRadius: 20, height: 44 },
                }}
              />
              <MuiTooltip title="Refrescar tabla" arrow>
                <IconButton
                  size="small"
                  onClick={() => loadDashboard()}
                  sx={{ color: "primary.main", "&:hover": { color: "primary.dark" } }}
                >
                  <RefreshIcon />
                </IconButton>
              </MuiTooltip>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {error && <Typography color="error" mb={2}>{error}</Typography>}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
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
                sx={{
                  borderRadius: 3,
                  "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
                  "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#ffffff" },
                  "& .MuiDataGrid-row:nth-of-type(odd)": { backgroundColor: "rgba(14,165,233,0.06)" },
                  "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,0.12) !important" },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
