import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Component crash:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <WarningAmber sx={{ fontSize: 64, color: 'warning.main' }} />
          <Typography variant="h5" fontWeight={700}>
            Sahifa yuklanishda xatolik yuz berdi
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
            Iltimos, sahifani yangilang. Muammo davom etsa, dastur administratoriga murojaat qiling.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => window.location.reload()}
          >
            Yangilash
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
