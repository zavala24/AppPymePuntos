import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

type Business = {
  id: number;
  name: string;
  logoUrl?: string | null;
};

type NotificationRow = {
  id: number;
  businessId: number;
  businessName: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string; // ISO
};

// MOCK: negocios seguidos o disponibles
const MOCK_BUSINESSES: Business[] = [
  { id: 1, name: "AMAROK Designs", logoUrl: "https://i.pravatar.cc/80?img=5" },
  { id: 2, name: "Paletita", logoUrl: "https://i.pravatar.cc/80?img=1" },
  { id: 3, name: "AO Balloons", logoUrl: "https://i.pravatar.cc/80?img=12" },
];

// MOCK: notificaciones enviadas
const MOCK_NOTIFICATIONS: NotificationRow[] = [
  {
    id: 100,
    businessId: 2,
    businessName: "Paletita",
    title: "¡Promo de verano!",
    body: "Hoy 2x1 en paletas para seguidores del negocio 🍦",
    imageUrl:
      "https://res.cloudinary.com/dknha4osj/image/upload/v1577821726/Paletita_csfg7c.png",
    createdAt: new Date().toISOString(),
  },
];

export default function NotificacionesPage() {
  // Datos de negocio y notificaciones
  const [businesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [rows, setRows] = useState<NotificationRow[]>(MOCK_NOTIFICATIONS);

  // Formulario
  const [businessId, setBusinessId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);

  // Otros estados
  const [query, setQuery] = useState("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({
    open: false,
    msg: "",
    type: "success",
  });

  const selectedBiz: Business | undefined = useMemo(
    () => businesses.find((b) => b.id === businessId),
    [businessId, businesses]
  );

  // Validación mínima
  const TITLE_MAX = 60;
  const BODY_MAX = 240;
  const isValid =
    typeof businessId === "number" &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    title.trim().length <= TITLE_MAX &&
    body.trim().length <= BODY_MAX;

  const handleSend = async () => {
    if (!isValid || typeof businessId !== "number") return;
    setSending(true);

    try {
      // Aquí luego llamaremos al backend:
      // await api.post('/notificaciones', {...})
      const now = new Date().toISOString();
      setRows((prev) => [
        {
          id: Math.max(0, ...prev.map((p) => p.id)) + 1,
          businessId,
          businessName: selectedBiz?.name ?? "",
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          createdAt: now,
        },
        ...prev,
      ]);

      setSnackbar({ open: true, msg: "Notificación enviada.", type: "success" });
      resetForm();
    } catch {
      setSnackbar({ open: true, msg: "No se pudo enviar.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setImageUrl("");
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.businessName.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const removeRow = (id: number) => {
    if (confirm("¿Eliminar esta notificación (sólo mock)?")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

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

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<RefreshIcon />}
              variant="outlined"
              onClick={() => setQuery("")}
            >
              Limpiar filtro
            </Button>
          </Stack>
        </Stack>

        <Divider className="my-4" />

        {/* Form + Preview */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* Formulario */}
          <Paper className="p-4 flex-1 border border-blue-100 rounded-xl">
            <Stack spacing={2}>
              <TextField
                select
                label="Negocio"
                value={businessId}
                onChange={(e) => setBusinessId(Number(e.target.value))}
                fullWidth
              >
                {businesses.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={b.logoUrl ?? undefined} alt={b.name} sx={{ width: 24, height: 24 }} />
                      <span>{b.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

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
                  disabled={!isValid || sending}
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
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={selectedBiz?.logoUrl ?? undefined}
                  alt={selectedBiz?.name ?? "Negocio"}
                  sx={{ width: 36, height: 36 }}
                />
                <Box>
                  <Typography fontWeight={800} color="primary">
                    {selectedBiz?.name || "Negocio"}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12}>
                    ahora
                  </Typography>
                </Box>
              </Stack>

              <Typography mt={2} fontWeight={800} color="primary">
                {title || "Título de la promoción"}
              </Typography>
              <Typography mt={0.5} color="text.secondary">
                {body || "Escribe aquí el detalle de la promoción."}
              </Typography>

              {imageUrl ? (
                <Box mt={2} borderRadius={2} overflow="hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* Tabla de notificaciones */}
      <Paper className="p-6 border border-blue-100 rounded-2xl shadow-sm">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <div>
            <Typography variant="h6" fontWeight={800}>
              Enviadas
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              Últimas notificaciones (mock).
            </Typography>
          </div>

          <TextField
            size="small"
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Negocio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cuerpo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Imagen</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      src={
                        businesses.find((b) => b.id === r.businessId)?.logoUrl ?? undefined
                      }
                      alt={r.businessName}
                      sx={{ width: 24, height: 24 }}
                    />
                    <span>{r.businessName}</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip size="small" color="primary" label={r.title} />
                </TableCell>
                <TableCell>
                  <Typography noWrap maxWidth={360} title={r.body}>
                    {r.body}
                  </Typography>
                </TableCell>
                <TableCell>
                  {r.imageUrl ? (
                    <Chip size="small" label="Sí" color="success" />
                  ) : (
                    <Chip size="small" label="No" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(r.createdAt).toLocaleString("es-MX")}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Eliminar (mock)">
                    <IconButton size="small" color="error" onClick={() => removeRow(r.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center" color="text.secondary">
                    Sin resultados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
