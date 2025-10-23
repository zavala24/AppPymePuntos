import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Collapse,
  Avatar,
  Tooltip,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import StoreIcon from "@mui/icons-material/Store";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutRounded from "@mui/icons-material/Logout";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/shared/auth/AuthContext";

const drawerWidth = 240;

/** Intenta obtener un nombre de usuario amigable */
function useDisplayName(token?: string | null) {
  return useMemo(() => {
    const lsUser =
      localStorage.getItem("username") ||
      localStorage.getItem("usuario") ||
      localStorage.getItem("usuarioNombre") ||
      localStorage.getItem("pa_user");

    if (lsUser && lsUser.trim()) return lsUser;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        return (
          payload?.unique_name ||
          payload?.name ||
          payload?.UsuarioNombre ||
          payload?.sub ||
          "Usuario"
        );
      } catch {
        /* noop */
      }
    }
    return "Usuario";
  }, [token]);
}

function initials(text: string) {
  const parts = text.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[0]?.[1] ?? "";
  return (first + second).toUpperCase();
}

export default function AppLayout() {
  const [openDrawer, setOpenDrawer] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { token, logout } = useAuth();
  const displayName = useDisplayName(token);

  // 🟣 Rol desde localStorage
  const role = (localStorage.getItem("pa_role") || "").trim().toLowerCase();
  const isSuperAdmin = role === "superadmin";

  // Submenú de configuración
  const [openConfig, setOpenConfig] = useState(pathname.startsWith("/configuracion"));
  useEffect(() => {
    setOpenConfig(pathname.startsWith("/configuracion"));
  }, [pathname]);

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // 🔹 Links principales (Negocios solo SuperAdmin)
  const primaryLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    ...(isSuperAdmin ? [{ to: "/negocios", label: "Negocios", icon: <StoreIcon /> }] : []),
    { to: "/usuarios", label: "Usuarios", icon: <PeopleIcon /> },
    { to: "/notificaciones", label: "Notificaciones", icon: <NotificationsIcon /> },
  ];

  // 🔹 Submenú de configuración (solo SuperAdmin ve estos)
  const configItems = isSuperAdmin
    ? [
        { to: "/configuracion/negocio", label: "Negocio", icon: <StoreIcon /> },
        { to: "/configuracion/usuarios", label: "Usuarios", icon: <PeopleIcon /> },
      ]
    : [];

  const hasConfigChildren = configItems.length > 0;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ======= TOP BAR ======= */}
      <AppBar position="fixed" color="primary" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpenDrawer(!openDrawer)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" fontWeight={800}>
            PremiaApp Admin
          </Typography>

          {/* Bienvenida a la derecha */}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title={displayName}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                {initials(displayName)}
              </Avatar>
            </Tooltip>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Bienvenido, <span style={{ fontWeight: 800 }}>{displayName}</span>
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ======= DRAWER ======= */}
      <Drawer
        variant="persistent"
        open={openDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            display: "flex",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <List sx={{ px: 1 }}>
            {/* === LINKS PRINCIPALES === */}
            {primaryLinks.map((l) => (
              <ListItemButton
                key={l.to}
                component={NavLink}
                to={l.to}
                selected={pathname.startsWith(l.to)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon>{l.icon}</ListItemIcon>
                <ListItemText primary={l.label} />
              </ListItemButton>
            ))}

            {/* === CONFIGURACIÓN === */}
            <ListItemButton
              onClick={() => hasConfigChildren && setOpenConfig((o) => !o)}
              selected={pathname.startsWith("/configuracion")}
              sx={{ borderRadius: 2, mt: 0.5 }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configuración" />
              {hasConfigChildren ? (openConfig ? <ExpandLess /> : <ExpandMore />) : null}
            </ListItemButton>

            {/* Submenú (solo SuperAdmin) */}
            {hasConfigChildren && (
              <Collapse in={openConfig} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 4, pr: 1, pt: 0.5 }}>
                  {configItems.map((c) => (
                    <ListItemButton
                      key={c.to}
                      component={NavLink}
                      to={c.to}
                      selected={pathname.startsWith(c.to)}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemIcon>{c.icon}</ListItemIcon>
                      <ListItemText primary={c.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </List>

          {/* Spacer para empujar el botón al fondo */}
          <Box sx={{ flexGrow: 1 }} />

          {/* === CERRAR SESIÓN === */}
          <Box sx={{ p: 1, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: 2,
                "& .MuiListItemIcon-root": { color: "error.main" },
                color: "error.main",
              }}
            >
              <ListItemIcon>
                <LogoutRounded />
              </ListItemIcon>
              <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>

      {/* ======= CONTENIDO ======= */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </Box>
    </Box>
  );
}
