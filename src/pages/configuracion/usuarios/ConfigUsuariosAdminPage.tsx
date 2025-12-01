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
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress,
  IconButton,
  Tooltip, // <--- AGREGADO AQUÍ
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Security";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/HighlightOff";
import RefreshIcon from "@mui/icons-material/Refresh";

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

function isEmail(v: string) {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function ConfigUsuariosAdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
    passwordNueva: "",
  });

  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const markTouched = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const resetTouched = () => setTouched({});

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
      passwordNueva: "",
    });

  const onNuevo = () => {
    setEditingId(null);
    clearForm();
    resetTouched();
  };
  const onCancelarEdicion = () => onNuevo();

  // ---------- Toast ----------
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<"success" | "error">("success");
  const showToast = (m: string, s: "success" | "error") => {
    setToastMsg(m);
    setToastSeverity(s);
    setToastOpen(true);
  };

  // ---------- Negocios ----------
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

  React.useEffect(() => {
    fetchNegocios("");
  }, [fetchNegocios]);

  // ---------- Grid ----------
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rowCount, setRowCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 5 });

  const mapToRow = (u: UserAdminDto): UserRow => ({
    id: u.idUsuario,
    usuarioLogin: u.usuarioNombre,
    nombre: u.nombre,
    apellidoPaterno: u.apellidoPaterno,
    apellidoMaterno: u.apellidoMaterno,
    email: u.email ?? "",
    telefono: u.telefono,
    idNegocio: u.idNegocio ?? 0,
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

  React.useEffect(() => {
    const t = setTimeout(() => loadPage(), 500);
    return () => clearTimeout(t);
  }, [search, loadPage]);

  React.useEffect(() => {
    loadPage();
  }, [paginationModel.page, paginationModel.pageSize, loadPage]);

  // ---------- Guardar ----------
  const [saving, setSaving] = React.useState(false);

  const validateRequired = {
    nombre: form.nombre.trim().length === 0,
    apellidoPaterno: form.apellidoPaterno.trim().length === 0,
    telefono: form.telefono.trim().length === 0,
    usuarioLogin: form.usuarioLogin.trim().length === 0,
    negocio: !form.negocio,
  };
  const invalidEmail = !isEmail(form.email);

  const onGuardar = async () => {
    setTouched({
      nombre: true,
      apellidoPaterno: true,
      telefono: true,
      usuarioLogin: true,
      negocio: true,
      email: true,
    });

    if (
      validateRequired.nombre ||
      validateRequired.apellidoPaterno ||
      validateRequired.telefono ||
      validateRequired.usuarioLogin ||
      validateRequired.negocio
    ) {
      showToast("Por favor completa los campos requeridos.", "error");
      return;
    }
    if (invalidEmail) {
      showToast("Email inválido.", "error");
      return;
    }

    const dto: CreateUpdateUserAdminDto = {
      idUsuario: editingId ?? 0,
      nombre: form.nombre.trim(),
      apellidoPaterno: form.apellidoPaterno.trim(),
      apellidoMaterno: form.apellidoMaterno.trim(),
      email: form.email?.trim() ? form.email.trim() : null,
      telefono: form.telefono.trim(),
      usuarioNombre: form.usuarioLogin.trim(),
      idNegocio: form.negocio!.id,
      isAdmin: form.isAdmin,
      activo: form.activo,
      passwordNueva: isEditing && form.passwordNueva.trim() ? form.passwordNueva.trim() : null,
    };

    try {
      setSaving(true);
      const resp = await userService.createOrUpdateAdmin(dto);
      if (resp.status === 200 || resp.status === 201) {
        showToast(
          resp.message || (isEditing ? "Usuario actualizado." : "Usuario creado."),
          "success"
        );
        setForm((f) => ({ ...f, passwordNueva: "" }));
        resetTouched();
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
      passwordNueva: "",
    });
    resetTouched();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns: GridColDef<UserRow>[] = [
    { field: "usuarioLogin", headerName: "Usuario", minWidth: 120, flex: 0.8 },
    { field: "nombre", headerName: "Nombre", minWidth: 150, flex: 1 },
    { field: "apellidoPaterno", headerName: "Apellido P.", minWidth: 150, flex: 1 },
    { field: "apellidoMaterno", headerName: "Apellido M.", minWidth: 150, flex: 1 },
    { field: "email", headerName: "Email", minWidth: 200, flex: 1 },
    { field: "telefono", headerName: "Teléfono", minWidth: 130, flex: 0.8 },
    { field: "negocio", headerName: "Negocio", minWidth: 150, flex: 1 },
    {
      field: "isAdmin",
      headerName: "Admin",
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />,
    },
    {
      field: "activo",
      headerName: "Activo",
      width: 90,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />,
    },
  ];

  const dynamicHeight = Math.min(700, 120 + paginationModel.pageSize * 55);

  const onTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D+/g, "");
    setForm((f) => ({ ...f, telefono: digits }));
  };

  return (
    <Box className="mx-auto w-full max-w-[1800px] px-2 md:px-6 py-4">
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        justifyContent="space-between" 
        gap={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Usuarios Admin
        </Typography>
        <Chip icon={<ShieldIcon />} label="Solo SUPER ADMIN" color="secondary" variant="outlined" size={isMobile ? "small" : "medium"} />
      </Stack>

      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1 }}>
          {isEditing ? "Editar usuario" : "Nuevo usuario"}
        </Typography>

        <Stack gap={2} sx={{ mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            <TextField
              fullWidth required label="Nombre" value={form.nombre}
              onBlur={() => markTouched("nombre")}
              error={touched.nombre && form.nombre.trim() === ""}
              helperText={touched.nombre && form.nombre.trim() === "" ? "Obligatorio" : ""}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
            <TextField
              fullWidth required label="Apellido paterno" value={form.apellidoPaterno}
              onBlur={() => markTouched("apellidoPaterno")}
              error={touched.apellidoPaterno && form.apellidoPaterno.trim() === ""}
              helperText={touched.apellidoPaterno && form.apellidoPaterno.trim() === "" ? "Obligatorio" : ""}
              onChange={(e) => setForm((f) => ({ ...f, apellidoPaterno: e.target.value }))}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            <TextField
              fullWidth label="Apellido materno" value={form.apellidoMaterno}
              onChange={(e) => setForm((f) => ({ ...f, apellidoMaterno: e.target.value }))}
            />
            <TextField
              fullWidth label="Email" type="email" value={form.email}
              onBlur={() => markTouched("email")}
              error={touched.email && !isEmail(form.email)}
              helperText={touched.email && !isEmail(form.email) ? "Correo inválido" : ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            <TextField
              fullWidth required label="Teléfono" value={form.telefono}
              onBlur={() => markTouched("telefono")}
              error={touched.telefono && form.telefono.trim() === ""}
              helperText={touched.telefono && form.telefono.trim() === "" ? "Obligatorio" : ""}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              onChange={onTelefonoChange}
            />
            <TextField
              fullWidth required label="Usuario (login)" value={form.usuarioLogin}
              onBlur={() => markTouched("usuarioLogin")}
              error={touched.usuarioLogin && form.usuarioLogin.trim() === ""}
              helperText={touched.usuarioLogin && form.usuarioLogin.trim() === "" ? "Obligatorio" : ""}
              onChange={(e) => setForm((f) => ({ ...f, usuarioLogin: e.target.value }))}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Autocomplete<NegOption, false, false, false>
                options={negOptions}
                loading={negLoading}
                value={form.negocio}
                onChange={(_, v) => {
                  setForm((f) => ({ ...f, negocio: v }));
                  markTouched("negocio");
                }}
                inputValue={negQuery}
                onInputChange={(_, v) => setNegQuery(v)}
                getOptionLabel={(o) => o?.nombre ?? ""}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Negocio"
                    required
                    onBlur={() => markTouched("negocio")}
                    error={touched.negocio && !form.negocio}
                    helperText={touched.negocio && !form.negocio ? "Selecciona un negocio" : ""}
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
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                fullWidth
                label="Nueva contraseña (solo edición)"
                value={form.passwordNueva}
                onChange={(e) => setForm((f) => ({ ...f, passwordNueva: e.target.value }))}
                disabled={!isEditing}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {isEditing ? "Se actualiza solo si escribes algo." : "Solo editable al modificar."}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.isAdmin}
                onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
              />
            }
            label="Es Administrador"
          />
          <FormControlLabel
            control={<Switch checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />}
            label="Activo"
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button startIcon={<AddIcon />} variant="outlined" color="primary" onClick={onNuevo}>Nuevo</Button>
          {isEditing && (
            <Button startIcon={<CancelIcon />} variant="outlined" color="warning" onClick={onCancelarEdicion}>
              Cancelar
            </Button>
          )}
          <Button startIcon={<SaveIcon />} variant="contained" color="success" onClick={onGuardar} disabled={saving}>
            {saving ? (isEditing ? "Actualizando..." : "Guardando...") : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={1} sx={{ p: { xs: 2, md: 2.5 }, width: '100%', overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">Usuarios registrados</Typography>
          
          <Tooltip title="Refrescar">
            <IconButton aria-label="Refrescar" onClick={() => loadPage()} sx={{ color: "primary.main", "&:hover": { color: "primary.dark" } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
          size="small"
          fullWidth
          sx={{
            mb: 3,
            maxWidth: { xs: "100%", md: 400 },
            "& .MuiOutlinedInput-root": { borderRadius: 20 },
          }}
        />

        <Box sx={{ height: dynamicHeight, width: "100%", overflowX: 'auto' }}>
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
            initialState={{
              columns: {
                columnVisibilityModel: {
                  apellidoPaterno: !isMobile,
                  apellidoMaterno: !isMobile,
                  email: !isMobile,
                  telefono: !isMobile,
                },
              },
            }}
            sx={{
              minWidth: isMobile ? 800 : '100%',
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "action.hover", fontWeight: 700 },
              "& .row-even": { backgroundColor: "#ffffff" },
              "& .row-odd": { backgroundColor: "rgba(14,165,233,0.06)" },
              "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(14,165,233,0.12) !important" },
              "& .MuiDataGrid-cell:focus": { outline: "none" },
            }}
          />
        </Box>
      </Paper>

      <Snackbar open={toastOpen} autoHideDuration={3500} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: "100%" }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}