// src/pages/configuracion/usuarios/ConfigUsuariosAdminPage.tsx
import * as React from "react";
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack, Divider,
  Snackbar, Alert, FormControlLabel, Switch, Autocomplete, CircularProgress
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/HighlightOff";

import { NegocioRepository } from "@/infrastructure/repositories/NegocioRepository";
import { NegocioService } from "@/application/services/NegocioService";
import type { INegocioService } from "@/application/services/INegocioService";
import type { NegocioDto } from "@/application/dtos/NegocioDto";

import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { UserService } from "@/application/services/UserService";
import type { IUserService } from "@/application/services/IUserService";
import type { CreateUpdateUserAdminDto } from "@/application/dtos/usuario/CreateUpdateUserAdminDto";
import type { UserAdminDto } from "@/application/dtos/usuario/UserAdminDto";

const negocioService: INegocioService = new NegocioService(new NegocioRepository());
const userService: IUserService = new UserService(new UserRepository());

type NegOption = { id: number; nombre: string };

// ===== tipos locales grid =====
type UserRow = {
  id: number;
  usuarioLogin: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string | null;
  telefono: string;
  idNegocio: number;
  negocio: string;
  isAdmin: boolean;
  activo: boolean;
};

export default function ConfigUsuariosAdminPage() {
  // ---------- Form ----------
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const isEditing = editingId != null && editingId > 0;

  const [form, setForm] = React.useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    telefono: "",
    usuarioLogin: "",
    isAdmin: true,
    activo: true,
    negocio: null as NegOption | null,
  });

  const clearForm = () =>
    setForm({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      telefono: "",
      usuarioLogin: "",
      isAdmin: true,
      activo: true,
      negocio: null,
    });

  const onNuevo = () => { setEditingId(null); clearForm(); };
  const onCancelarEdicion = () => onNuevo();

  // ---------- Toast ----------
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => { setToastMsg(m); setToastSeverity(s); setToastOpen(true); };

  // ---------- Dropdown negocios ----------
  const [negOptions, setNegOptions] = React.useState<NegOption[]>([]);
  const [negLoading, setNegLoading] = React.useState(false);
  const [negQuery, setNegQuery] = React.useState("");

  const fetchNegocios = React.useCallback(async (q: string) => {
    try {
      setNegLoading(true);
      const resp = await negocioService.getPaged(1, 10, q || null);
      if (resp.status === 200 && resp.data) {
        setNegOptions(resp.data.items.map((n: NegocioDto) => ({ id: n.idNegocio, nombre: n.nombre })));
      } else {
        setNegOptions([]);
      }
    } catch {
      setNegOptions([]);
    } finally {
      setNegLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => fetchNegocios(negQuery), 350);
    return () => clearTimeout(t);
  }, [negQuery, fetchNegocios]);

  React.useEffect(() => { fetchNegocios(""); }, [fetchNegocios]);

  // ---------- Grid ----------
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rowCount, setRowCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 5 });

  const mapToRow = (u: UserAdminDto): UserRow => ({
    id: u.idUsuario,
    usuarioLogin: u.usuarioNombre,             // del backend
    nombre: u.nombre,
    apellidoPaterno: u.apellidoPaterno,
    apellidoMaterno: u.apellidoMaterno,
    email: u.email ?? "",
    telefono: u.telefono,
    idNegocio: u.idNegocio ?? 0,               // viene en la respuesta
    negocio: u.negocioNombre,
    isAdmin: !!u.isAdmin,
    activo: !!u.activo,
  });

  const loadPage = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getAdminsPaged(paginationModel.page + 1, paginationModel.pageSize, search || null);
      if (res.status === 200 && res.data) {
        setRows(res.data.items.map(mapToRow));
        setRowCount(res.data.total);
      } else {
        setRows([]);
        setRowCount(0);
      }
    } catch {
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, search]);

  React.useEffect(() => { const t = setTimeout(() => loadPage(), 500); return () => clearTimeout(t); }, [search, loadPage]);
  React.useEffect(() => { loadPage(); }, [paginationModel.page, paginationModel.pageSize, loadPage]);

  // ---------- Guardar ----------
  const [saving, setSaving] = React.useState(false);
  const onGuardar = async () => {
    if (!form.telefono.trim()) { showToast("El teléfono es obligatorio.", "error"); return; }
    if (!form.nombre.trim() || !form.apellidoPaterno.trim()) { showToast("Nombre y Apellido paterno son obligatorios.", "error"); return; }
    if (!form.usuarioLogin.trim()) { showToast("El usuario (login) es obligatorio.", "error"); return; }
    if (!form.negocio) { showToast("Selecciona un negocio.", "error"); return; }

    const dto: CreateUpdateUserAdminDto = {
      idUsuario: editingId ?? 0,
      nombre: form.nombre.trim(),
      apellidoPaterno: form.apellidoPaterno.trim(),
      apellidoMaterno: form.apellidoMaterno.trim(),
      email: form.email?.trim() ? form.email.trim() : null,
      telefono: form.telefono.trim(),
      usuarioNombre: form.usuarioLogin.trim(),
      idNegocio: form.negocio.id,
      isAdmin: form.isAdmin,
      activo: form.activo,
    };

    try {
      setSaving(true);
      const resp = await userService.createOrUpdateAdmin(dto);
      if (resp.status === 200 || resp.status === 201) {
        showToast(resp.message || (isEditing ? "Usuario actualizado." : "Usuario creado."), "success");
        setEditingId(null);
        clearForm();
        setPaginationModel((m) => ({ ...m, page: 0 }));
        await loadPage();
      } else {
        showToast(resp.message || "No se pudo guardar.", "error");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Error de red.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Click fila => editar (carga campos separados + negocio por id)
  const onRowClick = (p: any) => {
    const r = p.row as UserRow;
    setEditingId(r.id);
    setForm({
      nombre: r.nombre ?? "",
      apellidoPaterno: r.apellidoPaterno ?? "",
      apellidoMaterno: r.apellidoMaterno ?? "",
      email: r.email ?? "",
      telefono: r.telefono ?? "",
      usuarioLogin: r.usuarioLogin ?? "",
      isAdmin: r.isAdmin,
      activo: r.activo,
      negocio: r.idNegocio ? { id: r.idNegocio, nombre: r.negocio } : null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Columnas grid (nombre y apellidos separados)
  const columns: GridColDef<UserRow>[] = [
    { field: "usuarioLogin", headerName: "Usuario", flex: 0.8 },
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "apellidoPaterno", headerName: "Apellido paterno", flex: 1 },
    { field: "apellidoMaterno", headerName: "Apellido materno", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "telefono", headerName: "Teléfono", flex: 0.8 },
    { field: "negocio", headerName: "Negocio", flex: 1 },
    {
      field: "isAdmin", headerName: "Admin", width: 100, align: "center", headerAlign: "center",
      renderCell: (p) => p.value ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />
    },
    {
      field: "activo", headerName: "Activo", width: 100, align: "center", headerAlign: "center",
      renderCell: (p) => p.value ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  return (
    <Box className="mx-auto w-full max-w-[1800px] px-4 md:px-6 py-4">
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" color="primary">Usuarios administrativos</Typography>
        <Chip icon={<ShieldIcon />} label="Solo SUPER ADMIN" color="secondary" variant="outlined" />
      </Stack>

      {/* Formulario */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{isEditing ? "Editar usuario" : "Nuevo usuario"}</Typography>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField fullWidth required label="Nombre" value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <TextField fullWidth required label="Apellido paterno" value={form.apellidoPaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoPaterno: e.target.value }))} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField fullWidth label="Apellido materno" value={form.apellidoMaterno}
            onChange={(e) => setForm((f) => ({ ...f, apellidoMaterno: e.target.value }))} />
          <TextField fullWidth label="Email" type="email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <TextField fullWidth required label="Teléfono" value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
          <TextField fullWidth required label="Usuario (login)" value={form.usuarioLogin}
            onChange={(e) => setForm((f) => ({ ...f, usuarioLogin: e.target.value }))} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ mb: 2 }}>
          <Autocomplete<NegOption, false, false, false>
            fullWidth
            loading={negLoading}
            options={negOptions}
            value={form.negocio}
            onChange={(_, v) => setForm((f) => ({ ...f, negocio: v }))}
            inputValue={negQuery}
            onInputChange={(_, v) => setNegQuery(v)}
            getOptionLabel={(o) => o?.nombre ?? ""}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Negocio"
                required
                placeholder="Buscar negocio..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {negLoading ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Stack direction="row" alignItems="center" gap={2}>
            <FormControlLabel
              control={<Switch checked={form.isAdmin} onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))} />}
              label="Admin"
            />
            <FormControlLabel
              control={<Switch checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />}
              label="Activo"
            />
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button startIcon={<AddIcon />} variant="outlined" color="primary" onClick={onNuevo}>Nuevo</Button>
          {isEditing && (
            <Button startIcon={<CancelIcon />} variant="outlined" color="warning" onClick={onCancelarEdicion}>
              Cancelar edición
            </Button>
          )}
          <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={onGuardar} disabled={saving}>
            {saving ? (isEditing ? "Actualizando..." : "Guardando...") : (isEditing ? "Actualizar" : "Guardar")}
          </Button>
        </Stack>
      </Paper>

      {/* Grid */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>
          Usuarios administrativos
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
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
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            disableRowSelectionOnClick
            onRowClick={onRowClick}
            paginationMode="server"
            rowCount={rowCount}
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

      {/* TOASTS */}
      <Snackbar open={toastOpen} autoHideDuration={3500} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: "100%" }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
