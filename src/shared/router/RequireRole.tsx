// src/shared/router/RequireRole.tsx
import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

type Props = {
  allow: string[];              // ["SuperAdmin"]
  children: React.ReactNode;
};

export default function RequireRole({ allow, children }: Props) {
  const location = useLocation();
  const role = (localStorage.getItem("pa_role") || "").toLowerCase();
  const allowed = allow.map(r => r.toLowerCase());

  if (!allowed.includes(role)) {
    // Opcional: podrías guardar a dónde intentó entrar con state.from
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
