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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";

import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { UserService } from "@/application/services/UserService";
import type { IUserService } from "@/application/services/IUserService";
import { UsuarioPorNegocioDto } from "@/application/dtos/usuario/UsuarioPorNegocioDto";
import { UpsertUsuarioDeNegocioDto } from "@/application/dtos/usuario/UpsertUsuarioDeNegocioDto";

// ---------- helpers ----------
const userService: IUserService = new UserService(new UserRepository());

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
  } catch {}
  return null;
}

function formatDateDDMMYYYY(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function onlyDigits(s: string) {
  return s.replace(/\D+/g, "");
}

function formatPhoneForDisplay(digits: string) {
  const clean = onlyDigits(digits).slice(0, 10);
  return clean; // muestra sin paréntesis; solo números como pediste
}

function isValidEmail(v: string) {
  if (!v) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// ---------- tipos ----------
type Row = UsuarioPorNegocioDto & { id: number };

type FormState = {
  idUsuario: number | null; // para saber si edita
  usuarioNombre: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  password: string; // opcional al editar
  activo: boolean;
};

export default function MisUsuariosPage() {
  // ------- estado base -------
  const [idNegocio, setIdNegocio] = React.useState<number | null>(null);

  // grid
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  // formulario
  const [form, setForm] = React.useState<FormState>({
    idUsuario: null,
    usuarioNombre: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    telefono: "",
    password: "",
    activo: true,
  });

  const isEditing = form.idUsuario != null;

  // validaciones
  const emailValid = React.useMemo(() => isValidEmail(form.email), [form.email]);
  const phoneDigits = React.useMemo(() => onlyDigits(form.telefono), [form.telefono]);
  const phoneValid = phoneDigits.length === 10;

  const allRequiredOk =
    form.usuarioNombre.trim() &&
    form.nombre.trim() &&
    form.apellidoPaterno.trim() &&
    phoneValid;

  const canSave = !!idNegocio && allRequiredOk;

  // toast
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  // dialogo eliminar
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // ------- carga inicial -------
  const load = React.useCallback(async () => {
    const id = getIdNegocioActual();
    setIdNegocio(id);
    if (!id) return;

    try {
      setLoading(true);
      const resp = await userService.GetUsuariosByNegocio(id);
      if (resp.status === 200 && resp.data) {
        const list = resp.data.map((u) => ({
          ...u,
          id: u.idUsuario, // grid id
          telefono: formatPhoneForDisplay(u.telefono ?? ""),
        }));
        setRows(list);
      } else {
        setRows([]);
        if (resp.message) showToast(resp.message, "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al cargar usuarios.", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // ------- limpiar / nuevo -------
  const clearForm = () =>
    setForm({
      idUsuario: null,
      usuarioNombre: "",
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      telefono: "",
      password: "",
      activo: true,
    });

  // ------- click fila -------
  const onRowClick = (params: any) => {
    const r = params.row as Row;
    setForm({
      idUsuario: r.idUsuario,
      usuarioNombre: r.usuarioNombre,
      nombre: r.nombre,
      apellidoPaterno: r.apellidoPaterno,
      apellidoMaterno: r.apellidoMaterno ?? "",
      email: r.email ?? "",
      telefono: formatPhoneForDisplay(r.telefono ?? ""),
      password: "",
      activo: !!r.activo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ------- guardar -------
  const onGuardar = async () => {
    if (!idNegocio) return;

    if (!emailValid) {
      showToast("Email inválido.", "error");
      return;
    }
    if (!phoneValid) {
      showToast("El teléfono debe tener 10 dígitos.", "error");
      return;
    }

    const dto: UpsertUsuarioDeNegocioDto = {
      idUsuario: form.idUsuario ?? 0,
      idNegocio,
      usuarioNombre: form.usuarioNombre.trim(),
      nombre: form.nombre.trim(),
      apellidoPaterno: form.apellidoPaterno.trim(),
      apellidoMaterno: form.apellidoMaterno?.trim() || "",
      email: form.email?.trim() || null,
      telefono: phoneDigits,
      password: form.password?.trim() || null,
      usuarioOperacion: localStorage.getItem("pa_user") || "admin",
      activo: form.activo,
    };

    try {
      const resp = await userService.upsertUsuarioDeNegocio(dto);
      if (resp.status === 200 || resp.status === 201) {
        showToast(resp.message || (isEditing ? "Usuario actualizado" : "Usuario creado"), "success");
        clearForm();
        await load();
      } else {
        showToast(resp.message || "No se pudo guardar.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al guardar.", "error");
    }
  };

  // ------- eliminar -------
  const onConfirmDelete = async () => {
    if (!idNegocio || !form.idUsuario) return;
    try {
      const resp = await userService.deleteUsuarioDeNegocio(form.idUsuario, idNegocio);
      if (resp.status === 200) {
        showToast(resp.message || "Usuario eliminado.", "success");
        setDeleteOpen(false);
        clearForm();
        await load();
      } else {
        showToast(resp.message || "No se pudo eliminar.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error al eliminar.", "error");
    }
  };

  // ------- columnas -------
  const columns: GridColDef<Row>[] = [
    { field: "usuarioNombre", headerName: "Usuario", flex: 0.9 },
    { field: "nombre", headerName: "Nombre", flex: 1.0 },
    { field: "apellidoPaterno", headerName: "Apellido paterno", flex: 0.9 },
    { field: "apellidoMaterno", headerName: "Apellido materno", flex: 0.9 },
    { field: "email", headerName: "Email", flex: 1.2 },
    { field: "telefono", headerName: "Teléfono", width: 140 },
    {
      field: "fechaRegistro",
      headerName: "Registro",
      width: 130,
      valueGetter: (p) => formatDateDDMMYYYY(p),
    },
    {
      field: "activo",
      headerName: "Activo",
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? <CheckIcon color="success" fontSize="small" /> : <RemoveIcon color="disabled" fontSize="small" />,
      sortable: false,
      filterable: false,
    },
  ];

  // altura dinámica
  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: 2,
            rowGap: 2,
          }}
        >
          <TextField
            label="Usuario *"
            value={form.usuarioNombre}
            onChange={(e) => setForm((f) => ({ ...f, usuarioNombre: e.target.value }))}
            required
          />
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />

          <TextField
            label="Apellido paterno"
            value={form.apellidoPaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoPaterno: e.target.value }))}
            required
          />
          <TextField
            label="Apellido materno"
            value={form.apellidoMaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoMaterno: e.target.value }))}
          />

          <TextField
            label="Email (opcional)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onBlur={() => setForm((f) => ({ ...f, email: f.email.trim().toLowerCase() }))}
            error={!emailValid}
            helperText={!emailValid ? "Email inválido" : "Opcional"}
          />
          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => {
              const next = onlyDigits(e.target.value).slice(0, 10);
              setForm((f) => ({ ...f, telefono: next }));
            }}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10 }}
            error={form.telefono !== "" && !phoneValid}
            helperText="Requerido, 10 dígitos"
            required
          />

          <TextField
            label="Nueva contraseña (opcional)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            type="password"
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Switch
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
          }
          label="Activo"
        />

        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={clearForm}>
            Nuevo
          </Button>
          {isEditing && (
            <Button startIcon={<CancelIcon />} variant="outlined" color="warning" onClick={clearForm}>
              Cancelar edición
            </Button>
          )}
          {isEditing && (
            <Button
              startIcon={<DeleteIcon />}
              variant="outlined"
              color="error"
              onClick={() => setDeleteOpen(true)}
            >
              Eliminar
            </Button>
          )}
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            color="success"
            onClick={onGuardar}
            disabled={!canSave}
          >
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      {/* GRID */}
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
            rows={rows.filter((r) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                r.usuarioNombre?.toLowerCase().includes(q) ||
                r.nombre?.toLowerCase().includes(q) ||
                r.apellidoPaterno?.toLowerCase().includes(q) ||
                r.apellidoMaterno?.toLowerCase().includes(q) ||
                (r.email ?? "").toLowerCase().includes(q)
              );
            })}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            onRowClick={onRowClick}
            paginationMode="client"
            rowCount={rows.length}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50]}
            getRowClassName={(p) => (p.indexRelativeToCurrentPage % 2 === 0 ? "row-even" : "row-odd")}
            sx={{
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              "& .row-even": { backgroundColor: "#ffffff" },
              "& .row-odd": { backgroundColor: "rgba(14,165,233,0.06)" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,0.12) !important" },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            }}
          />
        </Box>
      </Paper>

      {/* DIALOG ELIMINAR */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar usuario</DialogTitle>
        <DialogContent>
          Esta acción quitará el rol de vendedor y lo desvinculará del negocio. El usuario quedará
          como cliente. ¿Deseas continuar?
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onConfirmDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
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
