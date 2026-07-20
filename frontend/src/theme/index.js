import { createTheme } from '@mui/material/styles';

// Neon-on-navy palette. Hex values only — no data, text, or layout below
// this line depends on business logic.
const NEON = {
  cyan: '#22D3EE',
  blue: '#3B82F6',
  amber: '#F59E0B',
  pink: '#EC4899',
  green: '#34D399',
  rose: '#F43F5E',
  violet: '#A78BFA',
};

const BG_DEFAULT = '#070B14';
const BG_PAPER = '#0E1626';
const BG_ELEVATED = '#111B30';
const BORDER_SOFT = 'rgba(148,163,184,0.14)';
const BORDER_NEON = 'rgba(34,211,238,0.18)';
const TEXT_PRIMARY = '#E7ECF5';
const TEXT_SECONDARY = '#8A97AC';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: NEON.cyan, light: '#67E8F9', dark: '#0891B2', contrastText: '#04141A' },
    secondary: { main: NEON.pink, light: '#F472B6', dark: '#BE185D' },
    success: { main: NEON.green, light: '#6EE7B7', dark: '#059669' },
    warning: { main: NEON.amber, light: '#FBBF24', dark: '#B45309' },
    error: { main: NEON.rose, light: '#FB7185', dark: '#BE123C' },
    info: { main: NEON.blue, light: '#60A5FA', dark: '#1D4ED8' },
    background: { default: BG_DEFAULT, paper: BG_PAPER },
    text: { primary: TEXT_PRIMARY, secondary: TEXT_SECONDARY, disabled: '#4B5670' },
    grey: { 50: '#0B1220', 100: '#111B30', 200: '#1B2540', 300: '#2A3654', 400: '#3D4A6B' },
    divider: BORDER_SOFT,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600, color: TEXT_PRIMARY },
    h2: { fontSize: '1.75rem', fontWeight: 600, color: TEXT_PRIMARY },
    h3: { fontSize: '1.5rem', fontWeight: 600, color: TEXT_PRIMARY },
    h4: { fontSize: '1.25rem', fontWeight: 600, color: TEXT_PRIMARY },
    h5: { fontSize: '1.1rem', fontWeight: 600, color: TEXT_PRIMARY },
    h6: { fontSize: '1rem', fontWeight: 600, color: TEXT_PRIMARY },
    body1: { fontSize: '0.875rem', color: '#C3CCDD' },
    body2: { fontSize: '0.8125rem', color: TEXT_SECONDARY },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500, color: '#C3CCDD' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500, color: '#C3CCDD' },
    caption: { fontSize: '0.75rem', color: TEXT_SECONDARY },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${BORDER_NEON} ${BG_DEFAULT}`,
          '&::-webkit-scrollbar': { width: 10, height: 10 },
          '&::-webkit-scrollbar-track': { background: BG_DEFAULT },
          '&::-webkit-scrollbar-thumb': { background: '#1E2A45', borderRadius: 8 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: BG_PAPER,
          boxShadow: `0 0 0 1px ${BORDER_NEON}, 0 8px 28px rgba(0,0,0,0.45)`,
          borderRadius: 16,
          border: 'none',
          transition: 'box-shadow 0.2s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${BORDER_NEON}, transparent)`,
          },
          '&:hover': {
            boxShadow: `0 0 0 1px rgba(34,211,238,0.32), 0 10px 32px rgba(0,0,0,0.55)`,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          borderRadius: 10,
          padding: '7px 16px',
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: BORDER_SOFT,
          '&:hover': { borderWidth: '1.5px', borderColor: NEON.cyan, backgroundColor: 'rgba(34,211,238,0.08)' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${NEON.cyan} 0%, ${NEON.blue} 100%)`,
          boxShadow: '0 4px 16px rgba(34,211,238,0.28)',
          '&:hover': { background: `linear-gradient(135deg, ${NEON.cyan} 0%, ${NEON.blue} 100%)`, boxShadow: '0 4px 20px rgba(34,211,238,0.42)' },
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
            backgroundColor: BG_ELEVATED,
            color: TEXT_SECONDARY,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.4px',
            borderBottom: `1.5px solid ${BORDER_SOFT}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(34,211,238,0.05)' },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${BORDER_SOFT}`,
            color: '#C3CCDD',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${BORDER_SOFT}`,
          color: TEXT_SECONDARY,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: 'none', boxShadow: '2px 0 24px rgba(0,0,0,0.5)', backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${BORDER_SOFT}`,
          backgroundColor: 'rgba(10,14,24,0.85)',
          backdropFilter: 'blur(10px)',
          color: TEXT_PRIMARY,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: 'rgba(148,163,184,0.14)' },
        bar: { borderRadius: 4 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          backgroundColor: 'rgba(148,163,184,0.04)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_SOFT, borderWidth: '1.5px' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(34,211,238,0.45)', borderWidth: '1.5px' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: NEON.cyan, borderWidth: '1.5px' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem', color: TEXT_SECONDARY },
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
    MuiMenu: {
      styleOverrides: {
        paper: { boxShadow: `0 0 0 1px ${BORDER_NEON}, 0 12px 32px rgba(0,0,0,0.55)`, backgroundColor: BG_ELEVATED },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: TEXT_SECONDARY,
          '&:hover': { color: NEON.cyan, backgroundColor: 'rgba(34,211,238,0.08)' },
        },
        colorError: {
          color: TEXT_SECONDARY,
          '&:hover': { color: NEON.rose, backgroundColor: 'rgba(244,63,94,0.1)' },
        },
      },
    },
  },
});

export default theme;
