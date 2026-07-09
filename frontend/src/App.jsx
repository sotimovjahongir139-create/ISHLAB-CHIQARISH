import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import uzLatn from './utils/dayjs-uz';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
import theme from './theme';
import VersionChecker from './components/VersionChecker';
import ErrorBoundary from './components/ErrorBoundary';

dayjs.locale(uzLatn);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uz-latn">
        <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} autoHideDuration={3500}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
          <VersionChecker />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
