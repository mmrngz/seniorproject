import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  Link as MuiLink,
  CircularProgress,
  Grid
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const LoginPage = ({ onLogin = () => {} }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form verilerini güncelle
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Giriş yap
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Normalde bir API çağrısı yapardık, ancak demo için basit bir doğrulama
      if (formData.email === 'demo@example.com' && formData.password === 'demo123') {
        // Kullanıcı bilgisini localStorage'a kaydet
        const user = {
          id: 1,
          email: formData.email,
          username: 'demo',
          display_name: 'Demo Kullanıcı'
        };
        localStorage.setItem('user', JSON.stringify(user));
        
        // Giriş başarılı
        onLogin(user);
        
        // Dashboard'a yönlendir
        navigate('/dashboard');
      } else {
        setError('Geçersiz e-posta veya şifre. Demo giriş bilgilerini kullanın: demo@example.com / demo123');
      }
    } catch (err) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUpIcon
              sx={{
                color: 'primary.main',
                fontSize: 40,
                mr: 1,
              }}
            />
            <Typography component="h1" variant="h4" fontWeight="bold">
              BIST Tahmin
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              p: 1,
              mb: 2,
            }}
          >
            <LockOutlinedIcon />
          </Box>

          <Typography component="h1" variant="h5" gutterBottom>
            Giriş Yap
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-posta Adresi"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Giriş Yap'}
            </Button>

            <Grid container>
              <Grid item>
                <MuiLink component={Link} to="/register" variant="body2">
                  {"Hesabınız yok mu? Kayıt olun"}
                </MuiLink>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          <strong>Demo Giriş Bilgileri:</strong> demo@example.com / demo123
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage; 