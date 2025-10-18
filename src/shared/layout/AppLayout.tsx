import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Box, IconButton, Collapse
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import { useEffect, useState } from 'react';

const drawerWidth = 240;

const primaryLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/negocios', label: 'Negocios', icon: <StoreIcon /> },
  { to: '/usuarios', label: 'Usuarios', icon: <PeopleIcon /> },
  { to: '/notificaciones', label: 'Notificaciones', icon: <NotificationsIcon /> },
];

export default function AppLayout() {
  const [openDrawer, setOpenDrawer] = useState(true);
  const { pathname } = useLocation();

  // Abrir/cerrar submenú de configuración según la ruta actual
  const [openConfig, setOpenConfig] = useState(pathname.startsWith('/configuracion'));
  useEffect(() => {
    setOpenConfig(pathname.startsWith('/configuracion'));
  }, [pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="primary" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpenDrawer(!openDrawer)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={800}>PremiaApp Admin</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={openDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {primaryLinks.map((l) => (
            <ListItemButton
              key={l.to}
              component={NavLink}
              to={l.to}
              selected={pathname.startsWith(l.to)}
            >
              <ListItemIcon>{l.icon}</ListItemIcon>
              <ListItemText primary={l.label} />
            </ListItemButton>
          ))}

          {/* Configuración (colapsable) */}
          <ListItemButton
            onClick={() => setOpenConfig((o) => !o)}
            selected={pathname.startsWith('/configuracion')}
          >
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Configuración" />
            {openConfig ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={openConfig} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              <ListItemButton
                component={NavLink}
                to="/configuracion/negocio"
                selected={pathname.startsWith('/configuracion/negocio')}
              >
                <ListItemIcon><StoreIcon /></ListItemIcon>
                <ListItemText primary="Negocio" />
              </ListItemButton>

              <ListItemButton
                component={NavLink}
                to="/configuracion/usuarios"
                selected={pathname.startsWith('/configuracion/usuarios')}
              >
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Usuarios" />
              </ListItemButton>
            </List>
          </Collapse>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </Box>
    </Box>
  );
}
