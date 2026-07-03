import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
    secondary: { main: '#0097A7', light: '#00ACC1', dark: '#00838F' },
    success: { main: '#16A34A', light: '#22C55E', dark: '#15803D' },
    warning: { main: '#E65100', light: '#EF6C00', dark: '#BF360C' },
    error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    info: { main: '#0284C7', light: '#38BDF8', dark: '#0369A1' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
    grey: { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600, color: '#111827' },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem', color: '#374151' },
    body2: { fontSize: '0.8125rem', color: '#6B7280' },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500, color: '#374151' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500, color: '#374151' },
    caption: { fontSize: '0.75rem', color: '#6B7280' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          borderRadius: 10,
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          borderRadius: 8,
          padding: '7px 16px',
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
        containedPrimary: {
          background: '#2563EB',
          '&:hover': { background: '#1D4ED8' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
          borderRadius: 20,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#F9FAFB',
            color: '#6B7280',
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.4px',
            borderBottom: '1.5px solid #E5E7EB',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F9FAFB' },
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #F3F4F6',
            color: '#374151',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: '1px solid #E5E7EB',
          color: '#6B7280',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.12)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          color: '#111827',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: '#E5E7EB' },
        bar: { borderRadius: 4 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB', borderWidth: '1.5px' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9CA3AF', borderWidth: '1.5px' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB', borderWidth: '1.5px' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem', color: '#6B7280' },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#6B7280',
          '&:hover': { color: '#374151', backgroundColor: 'rgba(0,0,0,0.04)' },
        },
        colorError: {
          color: '#6B7280',
          '&:hover': { color: '#DC2626', backgroundColor: 'rgba(220,38,38,0.06)' },
        },
      },
    },
  },
});

export default theme;
