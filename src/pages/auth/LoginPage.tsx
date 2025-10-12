import { Button, Paper, TextField, Typography } from '@mui/material';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <Paper elevation={3} sx={{ p: 4, width: 360, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={800} color="primary">Iniciar sesión</Typography>
        <TextField fullWidth label="Teléfono" sx={{ mt: 2 }} />
        <TextField fullWidth label="Contraseña" type="password" sx={{ mt: 2 }} />
        <Button fullWidth variant="contained" sx={{ mt: 3 }}>Entrar</Button>
      </Paper>
    </div>
  );
}
