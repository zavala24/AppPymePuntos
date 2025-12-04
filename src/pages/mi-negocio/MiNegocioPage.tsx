import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  useMediaQuery,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ShieldIcon from "@mui/icons-material/Security";
import CancelIcon from "@mui/icons-material/Cancel";

import { NegocioRepository } from "@/infrastructure/repositories/NegocioRepository";
import { NegocioService } from "@/application/services/NegocioService";
import type { INegocioService } from "@/application/services/INegocioService";
import { NegocioWithConfigDto } from "@/application/dtos/negocio/NegocioWithConfigDto";
import theme from "@/app/theme";

const negocioService: INegocioService = new NegocioService(new NegocioRepository());

// -------- Helpers --------
function getIdNegocioActual(): number | null {
  const ls = localStorage.getItem("pa_idNegocio");
  if (ls && !Number.isNaN(Number(ls))) return Number(ls);

  const token = localStorage.getItem("pa_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    if (payload?.idNegocio && !Number.isNaN(Number(payload.idNegocio))) {
      return Number(payload.idNegocio);
    }
  } catch {
    /* noop */
  }
  return null;
}

// -------- Tipos --------
type FormState = {
  // info pública
  nombre: string;
  facebook: string;
  instagram: string;
  sitioWeb: string;
  categoria: string;
  direccion: string;
  esActivo: boolean;

  // config
  permitirConfiguracionPersonalizada: boolean;
  porcentajeVentas: string;
  urlLogo: string;
};

export default function MiNegocioPage() {
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [idNegocio, setIdNegocio] = React.useState<number | null>(null);

  const [form, setForm] = React.useState<FormState>({
    nombre: "",
    facebook: "",
    instagram: "",
    sitioWeb: "",
    categoria: "",
    direccion: "",
    esActivo: true,
    permitirConfiguracionPersonalizada: false,
    porcentajeVentas: "",
    urlLogo: "",
  });

  // Snapshot para poder cancelar cambios
  const [initialForm, setInitialForm] = React.useState<FormState | null>(null);

  // -------- Toasts --------
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] =
    React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  // -------- Carga de datos --------
  const loadData = React.useCallback(async () => {
    const id = getIdNegocioActual();
    setIdNegocio(id);
    if (!id) {
      showToast("No se pudo determinar tu negocio.", "error");
      return;
    }

    try {
      setLoading(true);
      const resp = await negocioService.getWithConfig(id);
      if (resp.status === 200 && resp.data) {
        const d = resp.data as NegocioWithConfigDto;
        const nextForm: FormState = {
          nombre: d.nombreNegocio ?? "",
          facebook: d.facebook ?? "",
          instagram: d.instagram ?? "",
          sitioWeb: d.sitioWeb ?? "",
          categoria: d.categoria ?? "",
          direccion: d.direccion ?? "",
          esActivo: !!d.esActivo,

          permitirConfiguracionPersonalizada: !!(d as any)
            .permitirConfiguracionPersonalizada,
          porcentajeVentas:
            d.porcentajeVentas != null ? String(d.porcentajeVentas) : "",
          urlLogo: d.urlLogo ?? "",
        };
        setForm(nextForm);
        setInitialForm(nextForm); // ⟵ guardamos snapshot para poder cancelar
      } else {
        showToast(resp.message || "No se pudo cargar la información.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al cargar la información.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // -------- Validación porcentaje --------
  const percentRegex = /^\d*(?:[.,]\d*)?$/;
  const onPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length <= 6 && percentRegex.test(v)) {
      setForm((f) => ({ ...f, porcentajeVentas: v }));
    }
  };

  const parsedPercent = React.useMemo(() => {
    const cleaned = form.porcentajeVentas.replace(",", ".").trim();
    if (cleaned === "" || cleaned === ".") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [form.porcentajeVentas]);

  const percentIsValid =
    form.porcentajeVentas.trim() === "" ||
    (Number.isFinite(parsedPercent) &&
      parsedPercent >= 0 &&
      parsedPercent <= 100);

  const canSave = percentIsValid;

  // -------- Cancelar edición --------
  const onCancelarEdicion = () => {
    if (saving || loading) return;
    if (initialForm) {
      setForm(initialForm);
    }
  };

  // -------- Guardar --------
  const onGuardar = async () => {
    if (!idNegocio) {
      showToast("No se encontró el id del negocio.", "error");
      return;
    }
    if (!percentIsValid) {
      showToast("Porcentaje inválido (0-100).", "error");
      return;
    }

    try {
      setSaving(true);
      const resp = await negocioService.updateWithConfig({
        idNegocio,
        usuarioNombre: localStorage.getItem("pa_user") || "admin",
        // info pública
        nombre: form.nombre || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        sitioWeb: form.sitioWeb || null,
        categoria: form.categoria || null,
        direccion: form.direccion || null,
        esActivo: form.esActivo,
        // config
        permitirConfiguracionPersonalizada:
          form.permitirConfiguracionPersonalizada,
        porcentajeVentas:
          form.porcentajeVentas.trim() === "" ? null : parsedPercent,
        urlLogo: form.urlLogo?.trim() || null,
      } as any);

      if (resp.status === 200) {
        showToast(resp.message || "Datos guardados.", "success");
        await loadData(); // recarga y actualiza initialForm
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showToast(resp.message || "No se pudo guardar.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = React.useMemo(
    () => (form.urlLogo?.trim() ? form.urlLogo.trim() : ""),
    [form.urlLogo]
  );

  // -------- UI --------
  return (
    <Box className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4">
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        justifyContent="space-between" 
        gap={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Mi Negocio
        </Typography>
        <Chip icon={<ShieldIcon />} label="Solo ADMIN" color="secondary" variant="outlined" size={isMobile ? "small" : "medium"} />
      </Stack>

      {/* Información del negocio */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary"
          sx={{ mb: 2 }}
        >
          Información del negocio
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          gap={2}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            label="Nombre"
            value={form.nombre}
            onChange={(e) =>
              setForm((f) => ({ ...f, nombre: e.target.value }))
            }
            disabled={loading || saving}
          />
          <TextField
            fullWidth
            label="Facebook"
            value={form.facebook}
            onChange={(e) =>
              setForm((f) => ({ ...f, facebook: e.target.value }))
            }
            disabled={loading || saving}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          gap={2}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            label="Instagram"
            value={form.instagram}
            onChange={(e) =>
              setForm((f) => ({ ...f, instagram: e.target.value }))
            }
            disabled={loading || saving}
          />
          <TextField
            fullWidth
            label="Sitio web"
            value={form.sitioWeb}
            onChange={(e) =>
              setForm((f) => ({ ...f, sitioWeb: e.target.value }))
            }
            disabled={loading || saving}
          />
        </Stack>

        <TextField
          fullWidth
          label="Categoría"
          value={form.categoria}
          onChange={(e) =>
            setForm((f) => ({ ...f, categoria: e.target.value }))
          }
          sx={{ mb: 2 }}
          disabled={loading || saving}
        />

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Dirección"
          value={form.direccion}
          onChange={(e) =>
            setForm((f) => ({ ...f, direccion: e.target.value }))
          }
          sx={{ mb: 1 }}
          disabled={loading || saving}
        />
      </Paper>

      {/* Configuración de negocio */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color="primary"
          sx={{ mb: 1.5 }}
        >
          Configuración de negocio
        </Typography>

        {/* Grid con filas explícitas: el logo ocupa las 3 filas de la derecha */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gridTemplateRows: { xs: "auto", md: "auto auto auto" },
            gap: 2,
            alignItems: "start",
          }}
        >
          {/* Fila 1, Columna 1: Switch */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gridColumn: { xs: "1 / -1", md: "1 / 2" },
              gridRow: { xs: "auto", md: "1 / 2" },
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={form.permitirConfiguracionPersonalizada}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      permitirConfiguracionPersonalizada: e.target.checked,
                    }))
                  }
                  disabled={loading || saving}
                />
              }
              label="Permitir configuraciones personalizadas (Promociones)"
            />
          </Paper>

          {/* Fila 2, Columna 1: Porcentaje */}
          <TextField
            fullWidth
            label="Porcentaje de ventas (%)"
            placeholder="Ej. 0.01"
            inputMode="decimal"
            value={form.porcentajeVentas}
            onChange={onPercentChange}
            error={form.porcentajeVentas !== "" && !percentIsValid}
            helperText={
              form.porcentajeVentas !== "" && !percentIsValid
                ? "Debe estar entre 0 y 100"
                : "Máx. 6 caracteres"
            }
            inputProps={{ maxLength: 6 }}
            disabled={loading || saving}
            sx={{
              gridColumn: { xs: "1 / -1", md: "1 / 2" },
              gridRow: { xs: "auto", md: "2 / 3" },
            }}
          />

          {/* Fila 3, Columna 1: URL del logo */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              gridColumn: { xs: "1 / -1", md: "1 / 2" },
              gridRow: { xs: "auto", md: "3 / 4" },
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 0.5 }}
            >
              URL del logo
            </Typography>
            <TextField
              value={form.urlLogo}
              placeholder="https://..."
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
              disabled
            />
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ px: 0.5 }}
            >
              La imagen se usa para mostrar tu marca en la app.
            </Typography>
          </Paper>

          {/* Logo: Columna 2, ocupa filas 1 a 3 */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
              bgcolor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gridColumn: { xs: "1 / -1", md: "2 / 3" },
              gridRow: { xs: "auto", md: "1 / 4" },
              minHeight: { xs: 200, md: 280 },
              maxHeight: 300,
            }}
          >
            {previewUrl ? (
              <Box
                component="img"
                src={previewUrl}
                alt="Logo"
                sx={{
                  width: "100%",
                  maxWidth: 250, // antes 520
                  aspectRatio: "1 / 1",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 2,
                }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                Vista previa del logotipo
              </Typography>
            )}
          </Paper>
        </Box>

        {/* Botones guardar / cancelar */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            startIcon={<CancelIcon />}
            variant="outlined"
            color="warning"
            onClick={onCancelarEdicion}
            disabled={loading || saving || !initialForm}
          >
            Cancelar edición
          </Button>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            color="success"
            onClick={onGuardar}
            disabled={loading || saving || !canSave}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Box>
      </Paper>

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
    </Box>
  );
}
