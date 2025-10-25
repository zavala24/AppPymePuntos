// src/pages/usuarios/MisUsuariosPage.tsx
import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/HighlightOff";

import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { UserService } from "@/application/services/UserService";
import type { IUserService } from "@/application/services/IUserService";
import { UsuarioPorNegocioDto } from "@/application/dtos/usuario/UsuarioPorNegocioDto";
import { UpsertUsuarioDeNegocioDto } from "@/application/dtos/usuario/UpsertUsuarioDeNegocioDto";

// ---------- Helpers ----------
const onlyDigits = (s: string) => s.replace(/\D/g, "");

const formatPhone = (digits: string) => {
  const d = onlyDigits(digits).slice(0, 10);
  if (d.length === 0) return "";           
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

const isValidPhone10 = (digits: string) => /^\d{10}$/.test(onlyDigits(digits));
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

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

const userService: IUserService = new UserService(new UserRepository());

// ---------- Tipos ----------
type Row = UsuarioPorNegocioDto;

type FormState = {
  idUsuario: number | null;
  usuarioNombre: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string; // guardamos SOLO dígitos (10)
  activo: boolean;
  password: string; // opcional
};

// ---------- Componente ----------
export default function MisUsuariosPage() {
  // Datos
  const [rows, setRows] = React.useState<Row[]>([]);
  const [search, setSearch] = React.useState("");

  // Edición
  const [form, setForm] = React.useState<FormState>({
    idUsuario: null,
    usuarioNombre: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    telefono: "",
    activo: true,
    password: "",
  });
  const isEditing = form.idUsuario != null && form.idUsuario > 0;

  // Validaciones UI
  const [phoneError, setPhoneError] = React.useState<string>("");
  const [emailError, setEmailError] = React.useState<string>("");

  // Flags
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Toast
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  // Cargar usuarios
  const loadUsers = React.useCallback(async () => {
    const idNegocio = getIdNegocioActual();
    if (!idNegocio) {
      showToast("No se pudo determinar el negocio.", "error");
      return;
    }
    try {
      setLoading(true);
      const resp = await userService.GetUsuariosByNegocio(idNegocio);
      if (resp.status === 200 && resp.data) {
        setRows(resp.data);
      } else {
        setRows([]);
        showToast(resp.message || "No se pudieron cargar los usuarios.", "error");
      }
    } catch (e: any) {
      setRows([]);
      showToast(e?.message ?? "Error al cargar usuarios.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtros
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = (v?: string | null) => (v || "").toLowerCase().includes(q);
      return (
        hay(r.usuarioNombre) ||
        hay(r.nombre) ||
        hay(r.apellidoPaterno) ||
        hay(r.apellidoMaterno) ||
        hay(r.email) ||
        hay(r.telefono)
      );
    });
  }, [rows, search]);

  // Acciones
  const clearForm = () =>
    setForm({
      idUsuario: null,
      usuarioNombre: "",
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      telefono: "",
      activo: true,
      password: "",
    });

  const onNuevo = () => {
    clearForm();
    setPhoneError("");
    setEmailError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCancelarEdicion = () => {
    clearForm();
    setPhoneError("");
    setEmailError("");
  };

  const onRowClick = (params: any) => {
    const r = params.row as Row;
    setForm({
      idUsuario: r.idUsuario,
      usuarioNombre: r.usuarioNombre || "",
      nombre: r.nombre || "",
      apellidoPaterno: r.apellidoPaterno || "",
      apellidoMaterno: r.apellidoMaterno || "",
      email: r.email || "",
      telefono: onlyDigits(r.telefono || ""), // guardamos dígitos
      activo: !!r.activo,
      password: "",
    });
    setPhoneError("");
    setEmailError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onGuardar = async () => {
    const idNegocio = getIdNegocioActual();
    if (!idNegocio) {
      showToast("No se pudo determinar el negocio.", "error");
      return;
    }
    if (!form.usuarioNombre.trim()) {
      showToast("El usuario es obligatorio.", "error");
      return;
    }
    if (!form.nombre.trim()) {
      showToast("El nombre es obligatorio.", "error");
      return;
    }
    if (!isValidPhone10(form.telefono)) {
      setPhoneError("Ingresa un teléfono de 10 dígitos.");
      showToast("El teléfono es requerido (10 dígitos).", "error");
      return;
    }
    if (form.email.trim() && !isValidEmail(form.email)) {
      setEmailError("Correo no válido.");
      showToast("Corrige el correo electrónico.", "error");
      return;
    }

    const dto: UpsertUsuarioDeNegocioDto = {
      idUsuario: form.idUsuario ?? 0,
      idNegocio,
      usuarioNombre: form.usuarioNombre.trim(),
      nombre: form.nombre.trim(),
      apellidoPaterno: form.apellidoPaterno || null,
      apellidoMaterno: form.apellidoMaterno || null,
      email: form.email?.trim() || null,
      telefono: form.telefono, // dígitos
      activo: form.activo,
      password: form.password?.trim() || null,
      usuarioOperacion: localStorage.getItem("pa_user") || "admin",
    };

    try {
      setSaving(true);
      const resp = await userService.upsertUsuarioDeNegocio(dto);
      if (resp.status === 200) {
        showToast(resp.message || (isEditing ? "Usuario actualizado." : "Usuario creado."), "success");
        await loadUsers();
        clearForm();
      } else {
        showToast(resp.message || "No se pudo guardar el usuario.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Columnas
  const columns: GridColDef<Row>[] = [
    {
      field: "usuarioNombre",
      headerName: "Usuario",
      flex: 0.8,
    },
    { field: "nombre", headerName: "Nombre", flex: 1.1 },
    { field: "apellidoPaterno", headerName: "Apellido paterno", flex: 0.9 },
    { field: "apellidoMaterno", headerName: "Apellido materno", flex: 0.9 },
    {
      field: "email",
      headerName: "Email",
      flex: 1.2,
      renderCell: (p) => {
        const email = (p.value as string) || "";
        if (!email) return "";
        return (
          <a href={`mailto:${email}`} style={{ color: "#1976d2", textDecoration: "none" }}>
            {email}
          </a>
        );
      },
    },
    {
      field: "telefono",
      headerName: "Teléfono",
      width: 160,
      valueGetter: (p) => {
        const d = onlyDigits((p as string) || "");
        return isValidPhone10(d) ? formatPhone(d) : p;
      },
    },
    {
      field: "fechaRegistro",
      headerName: "Registro",
      width: 160,
      valueGetter: (p) => formatDate(p as string),
    },
    {
      field: "activo",
      headerName: "Activo",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />,
    },
  ];

  // Altura grid
  const dynamicHeight = Math.min(700, 120 + Math.max(5, filtered.length) * 55);

  return (
    <Box className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4">
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" color="primary">
          Mis usuarios
        </Typography>
        <Chip icon={<ShieldIcon />} label="Solo ADMIN" color="secondary" variant="outlined" />
      </Stack>

      {/* Formulario */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {isEditing ? "Editar usuario" : "Nuevo usuario"}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Usuario *"
            value={form.usuarioNombre}
            onChange={(e) => setForm((f) => ({ ...f, usuarioNombre: e.target.value }))}
            disabled={loading || saving}
          />
          <TextField
            fullWidth
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            disabled={loading || saving}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Apellido paterno"
            value={form.apellidoPaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoPaterno: e.target.value }))}
            disabled={loading || saving}
          />
          <TextField
            fullWidth
            label="Apellido materno"
            value={form.apellidoMaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoMaterno: e.target.value }))}
            disabled={loading || saving}
          />
        </Stack>

        {/* Email (opcional) y Teléfono (requerido) */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Email (opcional)"
            value={form.email}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, email: v }));
              if (v.trim().length === 0) setEmailError("");
              else if (!isValidEmail(v)) setEmailError("Correo no válido (ej. usuario@dominio.com).");
              else setEmailError("");
            }}
            onBlur={() => {
              const v = (form.email || "").trim();
              if (v && !isValidEmail(v)) setEmailError("Correo no válido.");
            }}
            error={!!emailError}
            helperText={emailError || "Opcional"}
            disabled={loading || saving}
          />

          <TextField
            fullWidth
            required
            label="Teléfono"
            placeholder="(###) ###-####"
            value={formatPhone(form.telefono)}
            onChange={(e) => {
              const digits = onlyDigits(e.target.value);
              if (digits.length <= 10) {
                setForm((f) => ({ ...f, telefono: digits }));
                setPhoneError("");
              }
            }}
            onBlur={() => {
              if (!isValidPhone10(form.telefono)) {
                setPhoneError("Ingresa un teléfono de 10 dígitos.");
              } else {
                setPhoneError("");
              }
            }}
            error={!!phoneError}
            helperText={phoneError || "Requerido, 10 dígitos"}
            inputProps={{ inputMode: "numeric", maxLength: 16 }}
            disabled={loading || saving}
          />
        </Stack>

        <TextField
          fullWidth
          label="Nueva contraseña (opcional)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          sx={{ mb: 1.5 }}
          disabled={loading || saving}
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              disabled={loading || saving}
            />
          }
          label="Activo"
        />

        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 1 }}>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={onNuevo}>
            Nuevo
          </Button>
          {isEditing && (
            <Button startIcon={<CancelIcon />} variant="outlined" color="warning" onClick={onCancelarEdicion}>
              Cancelar edición
            </Button>
          )}
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            color="success"
            onClick={onGuardar}
            disabled={saving || loading}
          >
            {saving ? (isEditing ? "Actualizando..." : "Guardando...") : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      {/* Grid */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>
          Usuarios del negocio
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, usuario, email..."
          size="small"
          fullWidth
          sx={{
            mb: 3,
            maxWidth: { xs: "100%", md: 720 },
            "& .MuiOutlinedInput-root": { borderRadius: 20, height: 44 },
            "& .MuiOutlinedInput-input": { lineHeight: "44px" },
          }}
        />

        <Box sx={{ height: dynamicHeight, width: "100%" }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(r) => r.idUsuario}
            loading={loading}
            disableRowSelectionOnClick
            onRowClick={onRowClick}
            pageSizeOptions={[5, 10, 20, 50]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
            sx={{
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,0.10) !important" },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            }}
          />
        </Box>
      </Paper>

      {/* Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: "100%" }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
