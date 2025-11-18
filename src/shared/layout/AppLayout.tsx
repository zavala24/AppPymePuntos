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
import LoyaltyIcon from "@mui/icons-material/Loyalty";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/shared/auth/AuthContext";

// ⭐ Logo de la marca
import Logo from "@/assets/Logo.png";

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
  if (!t) return "U";
  const first = t[0] ?? "";
  return first.toUpperCase();
}

export default function AppLayout() {
  const [openDrawer, setOpenDrawer] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { token, logout } = useAuth();
  const displayName = useDisplayName(token);

  // Roles
  const role = (localStorage.getItem("pa_role") || "").trim().toLowerCase();
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";

  // Submenú de configuración (abierto si estás en /configuracion/*)
  const [openConfig, setOpenConfig] = useState(
    pathname.startsWith("/configuracion")
  );
  useEffect(() => {
    setOpenConfig(pathname.startsWith("/configuracion"));
  }, [pathname]);

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ====== MENÚ PRINCIPAL ======
  const menuItems = [
    ...(isSuperAdmin
      ? [
          {
            to: "/negocios",
            label: "Negocios",
            icon: <StoreIcon />,
          },
        ]
      : []),

    ...(isAdmin
      ? [
          { to: "/mi-negocio", label: "Mi negocio", icon: <StoreIcon /> },
          { to: "/mis-usuarios", label: "Mis usuarios", icon: <PeopleIcon /> },
          {
            to: "/notificaciones",
            label: "Notificaciones",
            icon: <NotificationsIcon />,
          },
        ]
      : []),

    // CONFIGURACIÓN visible para SuperAdmin y Admin
    {
      kind: "config" as const,
      visible: isSuperAdmin || isAdmin,
      selected: pathname.startsWith("/configuracion"),
      children: isSuperAdmin
        ? [
            { to: "/configuracion/negocio", label: "Negocio", icon: <StoreIcon /> },
            { to: "/configuracion/usuarios", label: "Usuarios", icon: <PeopleIcon /> },
          ]
        : isAdmin
        ? [
            {
              to: "/configuracion/personalizar-promocion",
              label: "Promociones",
              icon: <LoyaltyIcon />,
            },
          ]
        : [],
    },

    // Dashboard
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <DashboardIcon />,
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* TOP BAR */}
      <AppBar position="fixed" color="primary" sx={{ zIndex: 1201 }}>
        <Toolbar sx={{ px: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpenDrawer(!openDrawer)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* ⭐ Logo + nombre del sistema */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src={Logo}
              alt="PyMe Fiel"
              sx={{ height: 30, width: "auto" }}
            />
            <Typography variant="h6" fontWeight={800}>
              PyMe Fiel Admin
            </Typography>
          </Box>

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

      {/* DRAWER */}
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
        {/* Header del drawer con logo */}
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
          }}
        >
          <Box
            component="img"
            src={Logo}
            alt="PyMe Fiel"
            sx={{ height: 28, width: "auto" }}
          />
        </Toolbar>

        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <List sx={{ px: 1 }}>
            {menuItems.map((item, idx) => {
              // Bloque Configuración
              if ((item as any).kind === "config") {
                const cfg = item as {
                  kind: "config";
                  visible: boolean;
                  selected: boolean;
                  children: Array<{ to: string; label: string; icon: JSX.Element }>;
                };
                if (!cfg.visible) return null;

                return (
                  <Box key={`cfg-${idx}`}>
                    <ListItemButton
                      onClick={() => setOpenConfig((o) => !o)}
                      selected={cfg.selected}
                      sx={{ borderRadius: 2, mt: 0.5 }}
                    >
                      <ListItemIcon>
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText primary="Configuración" />
                      {openConfig ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    <Collapse in={openConfig} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 4, pr: 1, pt: 0.5 }}>
                        {cfg.children.map((c) => (
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
                  </Box>
                );
              }

              // Ítems normales
              const it = item as { to: string; label: string; icon: JSX.Element };
              return (
                <ListItemButton
                  key={it.to}
                  component={NavLink}
                  to={it.to}
                  selected={pathname.startsWith(it.to)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon>{it.icon}</ListItemIcon>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              );
            })}
          </List>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Cerrar sesión */}
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
              <ListItemText
                primary="Cerrar sesión"
                primaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>

      {/* CONTENIDO */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </Box>
    </Box>
  );
}
