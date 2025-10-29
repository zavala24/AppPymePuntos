import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Avatar,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import type { INotificacionService } from "@/application/services/INotificacionService";
import { NotificacionService } from "@/application/services/NotificacionService";
import { NotificacionRepository } from "@/infrastructure/repositories/NotificacionRepository";
import { NotificacionDto } from "@/application/dtos/notificaciones/NotificacionDto";
import { SendNotificacionDto } from "@/application/dtos/notificaciones/SendNotificacionDto";

const notiService: INotificacionService = new NotificacionService(
  new NotificacionRepository()
);

/* ===================== helpers auth/ls ===================== */
function getClaim<T = any>(key: string): T | null {
  const token = localStorage.getItem("pa_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return (payload?.[key] as T) ?? null;
  } catch {
    return null;
  }
}

function getIdUsuarioActual(): number | null {
  const ls = localStorage.getItem("pa_idUsuario");
  if (ls && !Number.isNaN(Number(ls))) return Number(ls);
  const claim = getClaim<number>("idUsuario");
  return typeof claim === "number" ? claim : null;
}

function getUsuarioNombre(): string {
  return (
    localStorage.getItem("pa_user") ||
    getClaim<string>("unique_name") ||
    getClaim<string>("name") ||
    "Usuario"
  );
}

function getNegocioLogo(): string | null {
  return localStorage.getItem("pa_logoUrl") || (getClaim<string>("urlLogo") ?? null);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/* ===================== tipos ===================== */
type GridRow = {
  id: number;
  title: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
};

/* ===================== componente ===================== */
export default function NotificacionesPage() {
  const idUsuario = getIdUsuarioActual(); // (por si lo necesitas para validaciones futuras)
  const usuarioNombre = getUsuarioNombre();
  const negocioLogo = getNegocioLogo();

  // grid
  const [rows, setRows] = useState<GridRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setImageUrl("");
  };

  // toast
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "error";
  }>({ open: false, msg: "", type: "success" });
  const showToast = (msg: string, type: "success" | "error") =>
    setSnackbar({ open: true, msg, type });

  // validación
  const TITLE_MAX = 60;
  const BODY_MAX = 240;
  const canSend =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    title.trim().length <= TITLE_MAX &&
    body.trim().length <= BODY_MAX;

  // cargar notificaciones por usuario
  const loadNotificaciones = useCallback(async () => {
    if (!usuarioNombre) {
      setRows([]);
      return;
    }

    try {
      setLoading(true);
      const res = await notiService.getByUsuario(usuarioNombre);
      if (res.status === 200 && res.data) {
        const mapped = res.data.map<GridRow>((n: NotificacionDto) => ({
          id: n.idNotificacion,
          title: n.titulo,
          body: n.cuerpo,
          imageUrl: n.urlLogo ?? null,
          createdAt: formatDate(n.creadoCuando),
        }));
        setRows(mapped);
      } else {
        setRows([]);
        if (res.message) showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al cargar notificaciones.", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [usuarioNombre]);

  useEffect(() => {
    loadNotificaciones();
  }, [loadNotificaciones]);

  // enviar
  const handleSend = async () => {
    if (!canSend) return;

    setSending(true);
    try {
      const dto: SendNotificacionDto = {
        usuarioNombre,
        titulo: title.trim(),
        cuerpo: body.trim(),
        urlLogo: imageUrl.trim() || null,
        creadoPor: usuarioNombre || "admin",
      };

      const resp = await notiService.sendNotification(dto);
      if (resp.status === 201) {
        showToast(resp.message || "Notificación enviada.", "success");
        resetForm();
        await loadNotificaciones();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showToast(resp.message || "No se pudo enviar.", "error");
      }
    } catch (err: any) {
      showToast(err?.message ?? "Error al enviar.", "error");
    } finally {
      setSending(false);
    }
  };

  // filtro grid
  const filtered = useMemo(() => {
    if (!debouncedQuery) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(debouncedQuery) ||
        r.body.toLowerCase().includes(debouncedQuery)
    );
  }, [rows, debouncedQuery]);

  // columnas grid (solo Título, Cuerpo, Fecha)
  const columns: GridColDef<GridRow>[] = [
    {
      field: "title",
      headerName: "Título",
      flex: 1,
      renderCell: (p) => (
        <Chip size="small" color="primary" label={String(p.value)} sx={{ fontWeight: 600 }} />
      ),
    },
    {
      field: "body",
      headerName: "Cuerpo",
      flex: 2,
      renderCell: (p) => (
        <Typography
          variant="body2"
          title={String(p.value || "")}
          sx={{
            color: "text.secondary",
            display: "flex",
            alignItems: "center",
            height: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {String(p.value || "")}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 170,
      align: "center",
      headerAlign: "center",
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  return (
    <Box className="space-y-4">
      {/* Header + acciones */}
      <Paper className="p-6 border border-blue-100 rounded-2xl shadow-sm">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h5" fontWeight={800} color="primary">
              Enviar notificaciones
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              Redacta y envía promociones a los seguidores del negocio.
            </Typography>
          </div>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={() => {
              setQuery("");
              resetForm();
            }}
          >
            Limpiar filtro
          </Button>
        </Stack>

        <Divider className="my-4" />

        {/* Form + Preview */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* Formulario */}
          <Paper className="p-4 flex-1 border border-blue-100 rounded-xl">
            <Stack spacing={2}>
              <TextField
                label={`Título (${title.length}/${TITLE_MAX})`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                inputProps={{ maxLength: TITLE_MAX }}
                fullWidth
              />
              <TextField
                label={`Cuerpo (${body.length}/${BODY_MAX})`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                inputProps={{ maxLength: BODY_MAX }}
                fullWidth
                multiline
                rows={4}
              />
              <TextField
                label="URL imagen (opcional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<SendIcon />}
                  variant="contained"
                  disabled={!canSend || sending}
                  onClick={handleSend}
                >
                  {sending ? "Enviando…" : "Enviar"}
                </Button>
                <Button variant="text" onClick={resetForm}>
                  Limpiar
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Preview */}
          <Paper className="p-4 w-full md:w-96 border border-blue-100 rounded-xl">
            <Typography fontWeight={700} color="text.secondary" fontSize={13} mb={1}>
              Previsualización
            </Typography>

            <Paper
              className="p-4 rounded-xl border"
              sx={{
                borderColor: "primary.100",
                background:
                  "linear-gradient(135deg, rgba(239,246,255,1) 0%, rgba(219,234,254,1) 100%)",
              }}
              variant="outlined"
            >
              {/* Encabezado simplificado */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={negocioLogo ?? undefined} alt="" sx={{ width: 28, height: 28 }} />
                <Typography color="text.secondary" fontSize={12}>
                  ahora
                </Typography>
              </Stack>

              <Typography mt={2} fontWeight={800} color="primary">
                {title || "Título de la promoción"}
              </Typography>
              <Typography mt={0.5} color="text.secondary">
                {body || "Escribe aquí el detalle de la promoción."}
              </Typography>

              {imageUrl ? (
                <Box mt={2} borderRadius={2} overflow="hidden">
                  <img
                    src={imageUrl}
                    alt="imagen"
                    style={{ width: "100%", display: "block", borderRadius: 12 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://placehold.co/600x320?text=Imagen+no+disponible";
                    }}
                  />
                </Box>
              ) : (
                <Box
                  mt={2}
                  height={140}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="primary.50"
                  borderRadius={2}
                  border="1px dashed"
                  borderColor="primary.100"
                  color="primary.main"
                >
                  <Stack alignItems="center" spacing={1}>
                    <ImageIcon />
                    <Typography fontSize={12}>Sin imagen</Typography>
                  </Stack>
                </Box>
              )}
            </Paper>
          </Paper>
        </Stack>
      </Paper>

      {/* GRID */}
      <Paper className="p-6 border border-blue-100 rounded-2xl shadow-sm">
        <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 1 }}>
          Enviadas
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Buscador + Refresh (solo grid) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3, maxWidth: { xs: "100%", md: 720 } }}
        >
          <TextField
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
            placeholder="Buscar título o contenido…"
            size="small"
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 20, height: 44 },
              "& .MuiOutlinedInput-input": { lineHeight: "44px" },
            }}
          />
          <Tooltip title="Refrescar" arrow>
            <IconButton
              onClick={loadNotificaciones}
              disabled={loading}
              sx={{
                ml: 1,
                color: "primary.main",
                backgroundColor: "transparent",
                "&:hover": { backgroundColor: "transparent", color: "primary.dark" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={{ height: dynamicHeight, width: "100%" }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
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
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
