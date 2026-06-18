import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
import theme from './theme';

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} autoHideDuration={3500}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </SnackbarProvider>
  </ThemeProvider>
);

export default App;
