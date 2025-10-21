// src/shared/auth/RequireAuth.tsx
import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // mientras validamos token del storage no redirigimos
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
