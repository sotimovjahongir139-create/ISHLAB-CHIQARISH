import {
  Box, Card, CardContent, TextField, Button,
  Typography, InputAdornment, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#0D2137',
      p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box component="img" src="/logo.svg" alt="ARKON" sx={{ width: 72, height: 72, mb: 1.5 }} />
            <Typography variant="h5" fontWeight={800} color="primary" letterSpacing={2}>ARKON</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Hisobingizga kiring
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              sx={{ mb: 2 }}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Parol"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              sx={{ mb: 3 }}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass((s) => !s)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Kirish'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
