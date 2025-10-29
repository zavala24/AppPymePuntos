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
} from "@mui/material";
import MuiTooltip from "@mui/material/Tooltip";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import PolylineIcon from "@mui/icons-material/Polyline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Cell,
  Tooltip,
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
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";

const sellService = new SellService(new SellRepository());

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
  };
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

/* ============ Componente principal ============ */
export default function DashboardPage() {
  const usuarioNombre = localStorage.getItem("pa_user") || "";

  // Filtros con DatePicker (Dayjs)
  const [desde, setDesde] = React.useState<Dayjs | null>(null);
  const [hasta, setHasta] = React.useState<Dayjs | null>(null);

  // Buscador (grid)
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Estados “completos” del dashboard
  const [kpi, setKpi] = React.useState({
    totalVentas: 0,
    totalCobrado: 0,
    puntosGenerados: 0,
    ticketPromedio: 0,
  });
  const [ventasPorDia, setVentasPorDia] = React.useState<
    { dia: string; ventas: number }[]
  >([]);
  const [topArticulos, setTopArticulos] = React.useState<
    { name: string; qty: number; color: string }[]
  >([]);

  // Grid
  const [rows, setRows] = React.useState<VentaRowDto[]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 5,
    });

  // Loading
  const [loading, setLoading] = React.useState(false); // KPIs + charts
  const [rowsLoading, setRowsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Refs para capturar las gráficas
  const ventasDiaRef = React.useRef<HTMLDivElement>(null);
  const topArtRef = React.useRef<HTMLDivElement>(null);

  /* ================== LOADERS ================== */
  // Carga COMPLETA: solo KPIs + gráficas (+ opcionalmente primera página del grid)
  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const req: DashboardVentasRequest = {
        usuarioNombre,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
        page: 1,
        pageSize: 100,
        // ¡No mandes search aquí! para no recargar todo al teclear
      };

      const res: ServiceResponse<DashboardVentasResponse> =
        await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) {
        const d = res.data;

        setKpi({
          totalVentas: d.totalVentas,
          totalCobrado: d.totalCobrado,
          puntosGenerados: d.puntosGenerados,
          ticketPromedio: d.ticketPromedio,
        });

        setVentasPorDia(d.ventasPorDia.map((x) => ({ dia: x.dia, ventas: x.ventas })));
        setTopArticulos(
          d.topArticulos.map((x, i) => ({
            name: x.nombre,
            qty: x.cantidad,
            color: SOFT_COLORS[i % SOFT_COLORS.length],
          }))
        );

        // Precarga (opcional) de filas base
        setRows(d.rows);
        setTotalRows(d.totalRows);
      } else {
        setError(res.message || "Error al obtener las ventas");
      }
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [usuarioNombre, desde, hasta]);

  // Carga SOLO FILAS del grid (paginación y búsqueda)
  const loadRows = React.useCallback(async () => {
    setRowsLoading(true);
    try {
      const req: DashboardVentasRequest = {
        usuarioNombre,
        desde: desde ? desde.toDate() : undefined,
        hasta: hasta ? hasta.toDate() : undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedSearch || undefined,
      };

      const res: ServiceResponse<DashboardVentasResponse> =
        await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) {
        setRows(res.data.rows);
        setTotalRows(res.data.totalRows);
      } else {
        setRows([]);
        setTotalRows(0);
      }
    } finally {
      setRowsLoading(false);
    }
  }, [
    usuarioNombre,
    desde,
    hasta,
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearch,
  ]);

  // Efectos
  React.useEffect(() => {
    loadDashboard(); // on mount + cuando cambian fechas
  }, [loadDashboard]);

  // reset a página 0 cuando cambia el término
  React.useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [debouncedSearch]);

  // cargar filas cuando cambien search/paginación/fechas
  React.useEffect(() => {
    loadRows();
  }, [loadRows]);

  /* ================== KPIs render helper ================== */
  const kpiCards = [
    {
      label: "Ventas",
      value: String(kpi.totalVentas),
      icon: <ShoppingCartIcon sx={{ color: "#60a5fa" }} />,
    },
    {
      label: "Cobrado",
      value: fmtCurrency(kpi.totalCobrado),
      icon: <AttachMoneyIcon sx={{ color: "#34d399" }} />,
    },
    {
      label: "Puntos generados",
      value: kpi.puntosGenerados.toFixed(2),
      icon: <PercentIcon sx={{ color: "#a78bfa" }} />,
    },
    {
      label: "Ticket promedio",
      value: fmtCurrency(kpi.ticketPromedio),
      icon: <TrendingUpIcon sx={{ color: "#f59e0b" }} />,
    },
  ];

  /* ================== GRID ================== */
  const columns: GridColDef<VentaRowDto>[] = [
    { field: "folio", headerName: "Folio", width: 110 },
    { field: "articulo", headerName: "Artículo", width: 140 },
    { field: "descripcion", headerName: "Descripción", flex: 1, minWidth: 160 },
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
      width: 160,
      valueFormatter: (p) => fmtDate(p as string),
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

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

  // PNG (genérico, usa html-to-image)
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

  // SVG (serializa el primer <svg> dentro del contenedor)
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
              Filtra por fecha y revisa tus métricas
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <MuiTooltip title="Refrescar" arrow>
              <IconButton
                size="small"
                onClick={() => loadDashboard()}
                aria-label="Refrescar"
                sx={{ ml: 1, color: "primary.main", "&:hover": { color: "primary.dark" } }}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>
        </Stack>

        {/* Filtros (DatePicker) */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <DatePicker
              label="Desde"
              value={desde}
              onChange={(v) => setDesde(v)}
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
                onClick={loadDashboard}
                disabled={loading}
                sx={{ borderRadius: 2, px: 3 }}
              >
                {loading ? <CircularProgress size={20} /> : "Filtrar"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setDesde(null);
                  setHasta(null);
                  loadDashboard();
                }}
                sx={{ borderRadius: 2 }}
              >
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* KPIs */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2}>
          {kpiCards.map((k, i) => (
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

        {/* Charts */}
        <Stack direction={{ xs: "column", lg: "row" }} gap={2}>
          {/* Ventas por día */}
          <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <div>
                <Typography fontWeight={800} color="primary">
                  Ventas por día
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Últimos resultados por fecha
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

            {/* contenedor a capturar */}
            <Box ref={ventasDiaRef} sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ventasPorDia} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ventas" stroke="#60a5fa" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Paper>

          {/* Top artículos */}
          <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <div>
                <Typography fontWeight={800} color="primary">
                  Artículos más vendidos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Top por cantidad
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

            {/* contenedor a capturar */}
            <Box ref={topArtRef} sx={{ mt: 1.5, p: 1, borderRadius: 2, background: "#fff" }}>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topArticulos} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
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

        {/* Tabla */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 1 }}>
            Ventas recientes
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Search + refresh (como “Mis usuarios”) */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por folio, artículo, descripción…"
              size="small"
              fullWidth
              sx={{
                maxWidth: { xs: "100%", md: 720 },
                "& .MuiOutlinedInput-root": { borderRadius: 20, height: 44 },
                "& .MuiOutlinedInput-input": { lineHeight: "44px" },
              }}
            />
            <MuiTooltip title="Refrescar" arrow>
              <IconButton
                size="small"
                onClick={() => loadRows()}
                sx={{ color: "primary.main", "&:hover": { color: "primary.dark" } }}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>

          {error && <Typography color="error" mb={2}>{error}</Typography>}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: dynamicHeight, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(r) => r.folio}
                loading={rowsLoading}
                disableRowSelectionOnClick
                rowCount={totalRows}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 20, 50]}
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
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                    outline: "none",
                  },
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
