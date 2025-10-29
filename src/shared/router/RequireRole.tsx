// shared/router/RequireRole.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type Props = { allow: string[]; children: ReactNode };

export default function RequireRole({ allow, children }: Props) {
  const location = useLocation();
  const role = (localStorage.getItem("pa_role") || "").trim();

  // normaliza: "Admin" -> "admin"
  const hasAccess = allow.map(a => a.toLowerCase()).includes(role.toLowerCase());

  if (hasAccess) return <>{children}</>;

  // Importante: NO mandes a "/" para evitar el loop con el index->/dashboard
  return (
    <Navigate
      to="/acceso-denegado"
      replace
      state={{ from: location.pathname }}
    />
  );
}
