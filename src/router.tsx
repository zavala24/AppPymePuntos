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
import RequireRole from "./shared/router/RequireRole";
import MiNegocioPage from "./pages/mi-negocio/MiNegocioPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

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

      // 👇 Solo SUPERADMIN
      {
        path: "negocios",
        element: (
          <RequireRole allow={["SuperAdmin"]}>
            <NegociosPage />
          </RequireRole>
        ),
      },

      { path: "usuarios", element: <UsuariosPage /> },
      { path: "notificaciones", element: <NotificacionesPage /> },
      { path: "mi-negocio", element: (
              <RequireRole allow={["Admin"]}>
                <MiNegocioPage />
              </RequireRole>
            ),},
      {
        path: "configuracion",
        children: [
          {
            index: true,
            element: <Navigate to="/configuracion/negocio" replace />,
          },
          {
            path: "negocio",
            element: (
              <RequireRole allow={["SuperAdmin"]}>
                <ConfigNegocioPage />
              </RequireRole>
            ),
          },
          {
            path: "usuarios",
            element: (
              <RequireRole allow={["SuperAdmin"]}>
                <ConfigUsuariosAdminPage />
              </RequireRole>
            ),
          },
        ],
      }
    ],
  },

  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export default router;
