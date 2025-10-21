import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken, clearAuthToken } from "@/infrastructure/http/api";
import { AuthService } from "@/application/services/AuthService";
import { AuthRepository } from "@/infrastructure/repositories/AuthRepository";

type AuthContextType = {
  isAuthenticated: boolean;
  token?: string | null;
  error?: string | null;
  loading: boolean;
  login: (p: { userOrEmail: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as any);

const authService = new AuthService(new AuthRepository());

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Este efecto solo corre UNA VEZ
  useEffect(() => {
    const stored = localStorage.getItem("pa_token");
    if (stored) {
      setAuthToken(stored);
      setToken(stored);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []); // <-- muy importante

  const login = async ({ userOrEmail, password }: { userOrEmail: string; password: string }) => {
    try {
      setError(null);
      const res = await authService.loginWeb({ userOrEmail, password });
      if (res.status === 200 && res.data?.token) {
        const t = res.data.token;
        localStorage.setItem("pa_token", t);
        setAuthToken(t);
        setToken(t);
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

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem("pa_token");
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, error, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
