import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken, clearAuthToken, setOnUnauthorizedHandler } from "@/infrastructure/http/api";
import { AuthService } from "@/application/services/AuthService";
import { AuthRepository } from "@/infrastructure/repositories/AuthRepository";

type AuthContextType = {
  isAuthenticated: boolean;
  token?: string | null;
  userName?: string | null;
  role?: string | null;
  error?: string | null;
  loading: boolean;
  login: (p: { userOrEmail: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as any);
export const useAuth = () => useContext(AuthContext);

const authService = new AuthService(new AuthRepository());

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔵 Limpieza de sesión global
  const logout = () => {
    clearAuthToken();

    localStorage.removeItem("pa_token");
    localStorage.removeItem("pa_user");
    localStorage.removeItem("pa_role");

    setToken(null);
    setUserName(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  // 🔵 Registrar handler para manejar 401 automáticamente
  useEffect(() => {
    setOnUnauthorizedHandler(() => {
      logout(); // cerrar sesión
    });
  }, []);

  // 🔵 Cargar sesión almacenada
  useEffect(() => {
    const storedToken = localStorage.getItem("pa_token");
    const storedUser = localStorage.getItem("pa_user");
    const storedRole = localStorage.getItem("pa_role");

    if (storedToken) {
      setAuthToken(storedToken);
      setToken(storedToken);
      setIsAuthenticated(true);
    }

    if (storedUser) setUserName(storedUser);
    if (storedRole) setRole(storedRole);

    setLoading(false);
  }, []);

  // 🔵 Login
  const login = async ({ userOrEmail, password }: { userOrEmail: string; password: string }) => {
    try {
      setError(null);
      const res = await authService.loginWeb({ userOrEmail, password });

      if ((res.status === 200 || res.status === 201) && res.data?.token) {
        const t = res.data.token;
        const u = res.data.user ?? "";
        const r = res.data.role ?? "";

        localStorage.setItem("pa_token", t);
        localStorage.setItem("pa_user", u);
        localStorage.setItem("pa_role", r);

        setAuthToken(t);
        setToken(t);
        setUserName(u);
        setRole(r);
        setIsAuthenticated(true);

        return true;
      }

      setError(res.message || "Error de autenticación");
      return false;
    } catch (e: any) {
      setError(e?.message || "Error de red");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        userName,
        role,
        error,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
