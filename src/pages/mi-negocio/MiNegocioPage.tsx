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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ShieldIcon from "@mui/icons-material/Security";

import { NegocioRepository } from "@/infrastructure/repositories/NegocioRepository";
import { NegocioService } from "@/application/services/NegocioService";
import type { INegocioService } from "@/application/services/INegocioService";
import { NegocioWithConfigDto } from "@/application/dtos/negocio/NegocioWithConfigDto";

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
  nombre: string;
  facebook: string;
  instagram: string;
  sitioWeb: string;
  categoria: string;
  direccion: string;
  esActivo: boolean;
  porcentajeVentas: string;
  urlLogo: string;
};

export default function MiNegocioPage() {
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
    porcentajeVentas: "",
    urlLogo: "",
  });

  // -------- Toasts --------
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
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
        setForm({
          nombre: d.nombreNegocio ?? "",
          facebook: d.facebook ?? "",
          instagram: d.instagram ?? "",
          sitioWeb: d.sitioWeb ?? "",
          categoria: d.categoria ?? "",
          direccion: d.direccion ?? "",
          esActivo: !!d.esActivo,
          porcentajeVentas: d.porcentajeVentas != null ? String(d.porcentajeVentas) : "",
          urlLogo: d.urlLogo ?? "",
        });
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
  const percentRegex = /^\d*(?:[.,]\d*)?$/; // "", "10", "10.5", etc
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

  // ✅ Habilitar guardar siempre que el porcentaje sea válido (o vacío)
  const percentIsValid =
    form.porcentajeVentas.trim() === "" ||
    (Number.isFinite(parsedPercent) && parsedPercent >= 0 && parsedPercent <= 100);

  const canSave = percentIsValid; // ya NO depende de "nombre"

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
        nombre: form.nombre || null,      // nombre opcional
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        sitioWeb: form.sitioWeb || null,
        categoria: form.categoria || null,
        direccion: form.direccion || null,
        esActivo: form.esActivo,
        porcentajeVentas: form.porcentajeVentas.trim() === "" ? null : parsedPercent,
        urlLogo: form.urlLogo?.trim() || null,
      });

      if (resp.status === 200) {
        showToast(resp.message || "Datos guardados.", "success");
        await loadData();
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
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" color="primary">
          Mi negocio
        </Typography>
        <Chip icon={<ShieldIcon />} label="Solo ADMIN" color="secondary" variant="outlined" />
      </Stack>

      {/* Información */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Información del negocio
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            disabled={loading || saving}
          />
          <TextField
            fullWidth
            label="Facebook"
            value={form.facebook}
            onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
            disabled={loading || saving}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Instagram"
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            disabled={loading || saving}
          />
          <TextField
            fullWidth
            label="Sitio web"
            value={form.sitioWeb}
            onChange={(e) => setForm((f) => ({ ...f, sitioWeb: e.target.value }))}
            disabled={loading || saving}
          />
        </Stack>

        <TextField
          fullWidth
          label="Categoría"
          value={form.categoria}
          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
          sx={{ mb: 2 }}
          disabled={loading || saving}
        />

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Dirección"
          value={form.direccion}
          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
          sx={{ mb: 2 }}
          disabled={loading || saving}
        />
      </Paper>

      {/* Configuración */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Configuración de negocio
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr 260px" },
            columnGap: 2,
            rowGap: 2,
            alignItems: "stretch",
            mb: 2,
          }}
        >
          <TextField
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
          />

          <TextField
            label="URL del logo"
            value={form.urlLogo}
            multiline
            minRows={3}
            InputProps={{ readOnly: true }}
            disabled
          />

          <Box
            sx={{
              width: { xs: 220, md: 260 },
              height: { xs: 220, md: 260 },
              borderRadius: 2,
              bgcolor: "#f3f4f6",
              border: "1px dashed rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {previewUrl ? (
              <Box
                component="img"
                src={previewUrl}
                alt="Logo"
                sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                Vista previa
              </Typography>
            )}
          </Box>
        </Box>

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            color="success"
            onClick={onGuardar}
            disabled={loading || saving || !canSave}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      {/* TOAST */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2000} // 2s
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
