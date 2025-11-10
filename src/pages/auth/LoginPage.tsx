// src/pages/auth/LoginPage.tsx
import * as React from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "@/shared/auth/AuthContext";

export default function LoginPage() {
  const { login, error: authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  // Si venía de una ruta protegida, volver ahí; si no, dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  // Estado UI
  const remembered = React.useMemo(() => localStorage.getItem("rememberUser") ?? "", []);
  const [email, setEmail] = React.useState(remembered);
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(!!remembered);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  // Si ya está autenticado y aterriza en /login, redirige 1 sola vez
  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Ingresa usuario/email y contraseña.");
      return;
    }

    try {
      setLoading(true);

      if (remember) localStorage.setItem("rememberUser", email.trim());
      else localStorage.removeItem("rememberUser");

      const ok = await login({ userOrEmail: email.trim(), password });
      if (ok) {
        navigate(from, { replace: true });
      } else {
        setError(authError ?? "No se pudo iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
        bgcolor: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
      }}
      className="bg-gradient-to-br from-slate-50 to-white"
    >
      {/* Columna izquierda: branding */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          p: 6,
          background:
            "radial-gradient(1200px 600px at -10% -10%, rgba(59,130,246,0.08), transparent), radial-gradient(900px 500px at 110% 0%, rgba(16,185,129,0.08), transparent)",
        }}
      >
        <Box sx={{ maxWidth: 520 }}>
          <Typography variant="h2" fontWeight={800} color="primary" gutterBottom>
            PyMe Fiel Admin
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Inicia sesión para administrar negocios, usuarios y notificaciones.
          </Typography>

          <Box
            sx={{
              mt: 4,
              borderRadius: 4,
              p: 3,
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(226,232,240,0.7)",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              ¿Qué incluye?
            </Typography>
            <ul className="list-disc ml-5 text-slate-600 leading-relaxed">
              <li>Panel de control con métricas.</li>
              <li>Gestión de negocios y usuarios.</li>
              <li>Notificaciones y configuraciones avanzadas.</li>
              <li>Promociónes personalizadas.</li>
            </ul>
          </Box>
        </Box>
      </Box>

      {/* Columna derecha: tarjeta de login */}
      <Box className="flex items-center justify-center p-6 md:p-10">
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(8px)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Bienvenido 👋
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usa tus credenciales para continuar
              </Typography>
            </Box>
            {/* Logo placeholder */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              PF
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || authError}
            </Alert>
          )}

          <form onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email o usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                fullWidth
                required
              />

              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit && !loading) onSubmit(e as any);
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                disabled={!canSubmit || loading}
                sx={{ py: 1.2, borderRadius: 2, fontWeight: 700 }}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            © {new Date().getFullYear()} PyMe Fiel — Todos los derechos reservados
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
