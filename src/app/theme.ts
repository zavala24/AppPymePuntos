import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1D4ED8' },   // azul app
    secondary: { main: '#2563EB' },
    background: { default: '#F8FAFC' }, // gris azulado suave
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial'].join(','),
    h4: { fontWeight: 800 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
});

export default theme;
