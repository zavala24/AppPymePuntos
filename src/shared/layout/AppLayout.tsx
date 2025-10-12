import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

const drawerWidth = 240;

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/negocios', label: 'Negocios', icon: <StoreIcon /> },
  { to: '/usuarios', label: 'Usuarios', icon: <PeopleIcon /> },
  { to: '/notificaciones', label: 'Notificaciones', icon: <NotificationsIcon /> },
  { to: '/config', label: 'Config', icon: <SettingsIcon /> },
];

export default function AppLayout() {
  const [open, setOpen] = useState(true);
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="primary" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(!open)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={800}>PremiaApp Admin</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {links.map(l => (
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
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {/* contenedor con Tailwind para mantener tu estética */}
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </Box>
    </Box>
  );
}
