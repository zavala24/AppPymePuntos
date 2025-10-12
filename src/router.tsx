// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from './shared/layout/AppLayout';

// Páginas
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NegociosPage from './pages/negocios/NegociosPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import NotificacionesPage from './pages/notificaciones/NotificacionesPage';
import ConfigPage from './pages/config/ConfigPage';

const router = createBrowserRouter([
  // Ruta de login separada del layout
  { path: '/login', element: <LoginPage /> },

  // Rutas con layout
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'negocios', element: <NegociosPage /> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'notificaciones', element: <NotificacionesPage /> },
      { path: 'config', element: <ConfigPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
