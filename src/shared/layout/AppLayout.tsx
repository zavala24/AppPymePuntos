// src/shared/layout/AppLayout.tsx
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

/** Toma un nombre para mostrar del LS o del JWT */
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
  const t = (text || "").trim();
  if (!t) return "US";
  // Tomamos las dos primeras letras del primer "nombre"
  const first = t[0] ?? "";
  const second = t[1] ?? "";
  return (first + second).toUpperCase();
}

export default function AppLayout() {
  const [openDrawer, setOpenDrawer] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { token, logout } = useAuth();
  const displayName = useDisplayName(token);

  // Rol desde localStorage
  const role = (localStorage.getItem("pa_role") || "").trim().toLowerCase();
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";

  // Submenú de configuración
  const [openConfig, setOpenConfig] = useState(pathname.startsWith("/configuracion"));
  useEffect(() => {
    setOpenConfig(pathname.startsWith("/configuracion"));
  }, [pathname]);

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ====== LINKS PRINCIPALES ======
  // Dashboard siempre; luego "Mi negocio" solo para Admin; "Negocios" solo para SuperAdmin;
  const primaryLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    ...(isAdmin
      ? [{ to: "/mi-negocio", label: "Mi negocio", icon: <StoreIcon /> }]
      : []),
    ...(isSuperAdmin
      ? [{ to: "/negocios", label: "Negocios", icon: <StoreIcon /> }]
      : []),
    { to: "/usuarios", label: "Usuarios", icon: <PeopleIcon /> },
    { to: "/notificaciones", label: "Notificaciones", icon: <NotificationsIcon /> },
  ];

  // ====== SUBMENÚ CONFIGURACIÓN ======
  // Solo SuperAdmin ve estos hijos
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
            {/* === LINKS PRINCIPALES (con Mi negocio en 2do lugar si eres Admin) === */}
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

            {/* === CONFIGURACIÓN (siempre visible, pero sin hijos para no-SuperAdmin) === */}
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
