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
import MiNegocioPage from "./pages/mi-negocio/MiNegocioPage";
import MisUsuariosPage from "./pages/mis-usuarios/MisUsuariosPage";
import RequireRole from "./shared/router/RequireRole";

// 👇 Asegúrate del import con la ruta real del archivo
import CustomProductsPage from "./pages/configuracion/personalizar-promocion/CustomProductsPage";

// Pequeño componente para redirigir el index de /configuracion según rol
function ConfigIndexRedirect() {
  const role = (localStorage.getItem("pa_role") || "").trim().toLowerCase();
  const to =
    role === "superadmin"
      ? "/configuracion/negocio"
      : "/configuracion/personalizar-promocion";
  return <Navigate to={to} replace />;
}

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

      // Solo SUPERADMIN
      {
        path: "negocios",
        element: (
          <RequireRole allow={["SuperAdmin"]}>
            <NegociosPage />
          </RequireRole>
        ),
      },

      // Públicas según tu app
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "notificaciones", element: <NotificacionesPage /> },

      // Solo ADMIN
      {
        path: "mi-negocio",
        element: (
          <RequireRole allow={["Admin"]}>
            <MiNegocioPage />
          </RequireRole>
        ),
      },
      {
        path: "mis-usuarios",
        element: (
          <RequireRole allow={["Admin"]}>
            <MisUsuariosPage />
          </RequireRole>
        ),
      },

      // ===== Configuración =====
      {
        path: "configuracion",
        children: [
          // 🔁 Redirección dinámica según rol
          { index: true, element: <ConfigIndexRedirect /> },

          // 👑 Solo SuperAdmin
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

          // 🟦 Promociones (Admin; si quieres permitir también SuperAdmin, agrega "SuperAdmin")
          {
            path: "personalizar-promocion",
            element: (
              <RequireRole allow={["Admin"]}>
                <CustomProductsPage />
              </RequireRole>
            ),
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export default router;
