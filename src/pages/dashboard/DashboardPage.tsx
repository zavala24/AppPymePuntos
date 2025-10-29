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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PercentIcon from "@mui/icons-material/Percent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
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

// Services
import { SellRepository } from "@/infrastructure/repositories/SellRepository";
import { SellService } from "@/application/services/SellService";
import { ServiceResponse } from "@/shared/types/service-response";
import {
  DashboardVentasRequest,
  DashboardVentasResponse,
  VentaRowDto,
} from "@/application/dtos/ventas/DashboardVentasDto";
import MuiTooltip from "@mui/material/Tooltip";

const sellService = new SellService(new SellRepository());

/* ============ Helpers ============ */
function fmtCurrency(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { dateStyle: "medium" });
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

  const [data, setData] = React.useState<DashboardVentasResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 5,
    });

  // Cargar datos desde el backend
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
      };

      const res: ServiceResponse<DashboardVentasResponse> =
        await sellService.getVentasDashboard(req);

      if (res.status === 200 && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Error al obtener las ventas");
      }
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [usuarioNombre, desde, hasta]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ================== RENDER ================== */
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

  /* ================== Charts ================== */
  const ventasPorDia =
    data?.ventasPorDia?.map((x) => ({
      dia: x.dia,
      ventas: x.ventas,
    })) ?? [];

  const topArticulos =
    data?.topArticulos?.map((x, i) => ({
      name: x.nombre,
      qty: x.cantidad,
      color: SOFT_COLORS[i % SOFT_COLORS.length],
    })) ?? [];

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
                sx={{
                  ml: 1,
                  color: "primary.main",
                  backgroundColor: "transparent",
                  "&:hover": { backgroundColor: "transparent", color: "primary.dark" },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>

        </Stack>

        {/* Filtros (DatePicker bonitos) */}
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

        {/* Charts */}
        <Stack direction={{ xs: "column", lg: "row" }} gap={2}>
        <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
          <Typography fontWeight={800} color="primary">
            Ventas por día
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Últimos resultados por fecha
          </Typography>

          {/* margen arriba + altura */}
          <Box sx={{ mt: 1.5, height: 260 }}>
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
        </Paper>

        <Paper sx={{ p: 2.5, flex: 1, borderRadius: 3 }}>
          <Typography fontWeight={800} color="primary">
            Artículos más vendidos
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Top por cantidad
          </Typography>

          {/* margen arriba + altura */}
          <Box sx={{ mt: 1.5, height: 260 }}>
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
        </Paper>
        </Stack>

        {/* Tabla */}
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 1 }}>
            Ventas recientes
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {error && <Typography color="error" mb={2}>{error}</Typography>}
          {loading ? (
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
