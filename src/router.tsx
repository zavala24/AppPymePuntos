import { createBrowserRouter, Navigate } from "react-router-dom";

import AppLayout from "./shared/layout/AppLayout";
import RequireAuth from "./shared/auth/RequireAuth";

// Páginas
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import NegociosPage from "./pages/negocios/NegociosPage";
import UsuariosPage from "./pages/usuarios/UsuariosPage";
import NotificacionesPage from "./pages/notificaciones/NotificacionesPage";
import ConfigNegocioPage from "./pages/configuracion/negocio/ConfigNegocioPage";
import ConfigUsuariosAdminPage from "./pages/configuracion/usuarios/ConfigUsuariosAdminPage";

const router = createBrowserRouter([
  // 🔓 Rutas públicas (sin protección)
  { path: "/login", element: <LoginPage /> },

  // 🔐 Rutas protegidas
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "negocios", element: <NegociosPage /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "notificaciones", element: <NotificacionesPage /> },

      // ⚙️ Configuración (subrutas)
      {
        path: "configuracion",
        children: [
          { index: true, element: <Navigate to="/configuracion/negocio" replace /> },
          { path: "negocio", element: <ConfigNegocioPage /> },
          { path: "usuarios", element: <ConfigUsuariosAdminPage /> },
        ],
      },
    ],
  },

  // 🧭 Cualquier otra ruta redirige al dashboard
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export default router;
