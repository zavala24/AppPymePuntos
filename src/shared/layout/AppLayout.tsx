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
  useTheme,
  useMediaQuery,
  CssBaseline,
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

import Logo from "@/assets/Logo.png";

const drawerWidth = 260;

// 🎨 PALETA DE COLORES DEFINITIVA
const brandBlue = "#1565C0"; // El azul original de tu marca
const headerBg = "rgba(255, 255, 255, 0.95)"; // Blanco del header

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
      } catch { /* noop */ }
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
  const theme = useTheme();
  // Detectar si es escritorio (md para arriba)
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const displayName = useDisplayName(token);

  const role = (localStorage.getItem("pa_role") || "").trim().toLowerCase();
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";

  const [openConfig, setOpenConfig] = useState(pathname.startsWith("/configuracion"));

  useEffect(() => {
    setOpenConfig(pathname.startsWith("/configuracion"));
    // Si cambiamos a pantalla pequeña, cerramos el drawer móvil por defecto
    if (!isDesktop) setMobileOpen(false);
  }, [pathname, isDesktop]);

  const handleDrawerToggle = () => {
    if (isDesktop) {
      setDesktopOpen(!desktopOpen);
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    ...(isSuperAdmin ? [{ to: "/negocios", label: "Negocios", icon: <StoreIcon /> }] : []),
    ...(isAdmin
      ? [
          { to: "/mi-negocio", label: "Mi negocio", icon: <StoreIcon /> },
          { to: "/mis-usuarios", label: "Mis usuarios", icon: <PeopleIcon /> },
          { to: "/notificaciones", label: "Notificaciones", icon: <NotificationsIcon /> },
        ]
      : []),
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
            { to: "/configuracion/personalizar-promocion", label: "Promociones", icon: <LoyaltyIcon /> },
          ]
        : [],
    },
    { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  ];

  // --- ESTILOS DEL SIDEBAR (AZUL ORIGINAL) ---
  const drawerStyles = {
    "& .MuiDrawer-paper": {
      boxSizing: "border-box",
      width: drawerWidth,
      borderRight: "none",
      backgroundColor: brandBlue, // Vuelve a ser azul
      color: "#ffffff",
    },
    "& .MuiListItemIcon-root": {
      color: "rgba(255, 255, 255, 0.8)",
    },
    "& .Mui-selected": {
      backgroundColor: "rgba(255, 255, 255, 0.2) !important", // Fondo blanco translúcido
      "& .MuiListItemIcon-root": { color: "#ffffff" },
      "& .MuiListItemText-primary": { fontWeight: "bold" },
      borderLeft: "4px solid white", // Borde blanco
    },
    "& .MuiListItemButton-root:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  };

  const drawerContent = (
    <>
      {/* HEADER SIDEBAR: Ajustado para verse bien en móvil y escritorio */}
      <Toolbar 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: 'center',
          py: 3,
          px: 2,
          minHeight: '80px !important' // Asegura altura en móviles
        }}
      >
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            py: 1.5,
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
          }}
        >
          <Box
            component="img"
            src={Logo}
            alt="PyMe Fiel"
            sx={{ 
              height: 50,
              width: "auto", 
              maxWidth: "100%",
              objectFit: "contain",
            }} 
          />
        </Box>
      </Toolbar>

      <Box sx={{ overflow: "auto", flex: 1, px: 2 }}>
        <List>
          {menuItems.map((item, idx) => {
            if ((item as any).kind === "config") {
              const cfg = item as any;
              if (!cfg.visible) return null;
              return (
                <Box key={`cfg-${idx}`}>
                  <ListItemButton
                    onClick={() => setOpenConfig((o) => !o)}
                    selected={cfg.selected}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                  >
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Configuración" />
                    {openConfig ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={openConfig} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {cfg.children.map((c: any) => (
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
            const it = item as any;
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
      </Box>

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={onLogout}
          sx={{
            borderRadius: 2,
            color: "white",
            backgroundColor: "rgba(0,0,0,0.1)",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
            transition: '0.2s'
          }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <LogoutRounded />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f1f5f9" }}>
      <CssBaseline />
      
      {/* NAVBAR SUPERIOR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          // -- AQUÍ ESTÁ EL ARREGLO CLAVE --
          // En escritorio, AppBar va ENCIMA del Drawer (para efecto clipped)
          // En móvil, AppBar va DEBAJO del Drawer (para que el menú lo tape completo)
          zIndex: (theme) => isDesktop ? theme.zIndex.drawer + 1 : theme.zIndex.appBar,
          
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(isDesktop && desktopOpen && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
          bgcolor: headerBg, 
          color: brandBlue,  
          borderBottom: "1px solid #e2e8f0"
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800 }}>
            PyMe Fiel Admin
          </Typography>

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Bienvenido,
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: brandBlue }}>
                  {displayName}
                </Typography>
            </Box>
            <Tooltip title={displayName}>
              <Avatar 
                sx={{ 
                  bgcolor: brandBlue, 
                  color: "white", 
                  fontWeight: 'bold',
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                }}
              >
                {initials(displayName)}
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* NAV SIDEBAR */}
      <Box
        component="nav"
        sx={{ width: { md: desktopOpen ? drawerWidth : 0 }, flexShrink: { md: 0 }, transition: 'width 0.3s' }}
      >
        {/* Drawer Móvil (Temporary) */}
        <Drawer
          variant="temporary"
          open={!isDesktop && mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            ...drawerStyles
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Drawer Escritorio (Persistent) */}
        <Drawer
          variant="persistent"
          open={isDesktop && desktopOpen}
          sx={{
            display: { xs: "none", md: "block" },
            ...drawerStyles
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: "100%",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
           <Outlet />
        </Box>
      </Box>
    </Box>
  );
}