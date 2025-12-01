// src/pages/notificaciones/NotificacionesPage.tsx
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShieldIcon from "@mui/icons-material/Security";
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
  const theme = useTheme();
  // Detectar móvil
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const idUsuario = getIdUsuarioActual();
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

  // columnas grid
  const columns: GridColDef<GridRow>[] = [
    {
      field: "title",
      headerName: "Título",
      minWidth: 150,
      flex: 1,
      renderCell: (p) => (
        <Chip size="small" color="primary" label={String(p.value)} sx={{ fontWeight: 600 }} />
      ),
    },
    {
      field: "body",
      headerName: "Cuerpo",
      minWidth: 200,
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
    <Box className="mx-auto w-full max-w-[1800px] px-2 md:px-6 py-4">
      
      {/* Header Responsivo */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        justifyContent="space-between" 
        gap={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Notificaciones
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Envía promociones a tus seguidores.
          </Typography>
        </Box>
        <Chip
          icon={<ShieldIcon />}
          label="Solo ADMIN"
          color="secondary"
          variant="outlined"
          size={isMobile ? "small" : "medium"}
        />
      </Stack>

      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3, border: '1px solid #e0e7ff' }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          
          {/* Formulario */}
          <Box sx={{ flex: 1 }}>
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
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
                <Button
                  variant="text"
                  onClick={resetForm}
                  color="inherit"
                >
                  Limpiar
                </Button>
                <Button
                  startIcon={<SendIcon />}
                  variant="contained"
                  disabled={!canSend || sending}
                  onClick={handleSend}
                >
                  {sending ? "Enviando…" : "Enviar"}
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Divider solo visual en desktop */}
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

          {/* Preview */}
          <Box sx={{ width: { xs: '100%', md: 350 }, display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight={700} color="text.secondary" fontSize={13} mb={1}>
              VISTA PREVIA EN MÓVIL
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                borderColor: "primary.100",
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                width: '100%',
                maxWidth: 350,
                alignSelf: 'center'
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={negocioLogo ?? undefined} alt="" sx={{ width: 32, height: 32 }} />
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" fontSize={13}>PyMe Fiel App</Typography>
                    <Typography color="text.secondary" fontSize={11}>ahora</Typography>
                </Box>
              </Stack>

              <Typography mt={1.5} fontWeight={800} color="#1e3a8a" fontSize={15}>
                {title || "Título de la promoción"}
              </Typography>
              <Typography mt={0.5} color="text.secondary" fontSize={13} sx={{ lineHeight: 1.4 }}>
                {body || "Aquí aparecerá el detalle de tu promoción tal como lo verán los clientes."}
              </Typography>

              {imageUrl ? (
                <Box mt={2} borderRadius={2} overflow="hidden">
                  <img
                    src={imageUrl}
                    alt="imagen"
                    style={{ width: "100%", display: "block", borderRadius: 8 }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://placehold.co/600x320?text=Error+imagen";
                    }}
                  />
                </Box>
              ) : (
                <Box
                  mt={2}
                  height={120}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="rgba(255,255,255,0.6)"
                  borderRadius={2}
                  border="1px dashed"
                  borderColor="primary.main"
                  color="primary.main"
                >
                  <Stack alignItems="center" spacing={0.5}>
                    <ImageIcon fontSize="small" />
                    <Typography fontSize={11}>Sin imagen</Typography>
                  </Stack>
                </Box>
              )}
            </Paper>
          </Box>
        </Stack>
      </Paper>

      {/* GRID */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, width: '100%', overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={800} color="primary">
            Historial
          </Typography>
          <Tooltip title="Refrescar">
            <IconButton onClick={loadNotificaciones} disabled={loading} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <TextField
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPaginationModel((m) => ({ ...m, page: 0 }));
          }}
          placeholder="Buscar..."
          size="small"
          fullWidth
          sx={{ mb: 3, maxWidth: { xs: "100%", md: 400 } }}
        />

        <Box sx={{ height: dynamicHeight, width: "100%", overflowX: 'auto' }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50]}
            // Ocultar Fecha en móvil
            initialState={{
              columns: {
                columnVisibilityModel: {
                  createdAt: !isMobile,
                },
              },
            }}
            sx={{
              minWidth: isMobile ? 600 : '100%',
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#ffffff" },
              "& .MuiDataGrid-row:nth-of-type(odd)": { backgroundColor: "rgba(14,165,233,0.06)" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,0.12) !important" },
              "& .MuiDataGrid-cell:focus": { outline: "none" },
            }}
          />
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar((s) => ({ ...s, open: false })) }
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false })) }
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