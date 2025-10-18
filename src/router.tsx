import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './shared/layout/AppLayout';

// Páginas
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NegociosPage from './pages/negocios/NegociosPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import NotificacionesPage from './pages/notificaciones/NotificacionesPage';

// Configuración
import ConfigNegocioPage from './pages/configuracion/negocio/ConfigNegocioPage';
import ConfigUsuariosAdminPage from './pages/configuracion/usuarios/ConfigUsuariosAdminPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'negocios', element: <NegociosPage /> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'notificaciones', element: <NotificacionesPage /> },

      {
        path: 'configuracion',
        children: [
          { index: true, element: <Navigate to="/configuracion/negocio" replace /> },
          { path: 'negocio', element: <ConfigNegocioPage /> },
          { path: 'usuarios', element: <ConfigUsuariosAdminPage /> }, // 👈 NUEVO
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
