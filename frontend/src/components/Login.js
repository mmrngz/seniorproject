import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Grid, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Giriş işlemi
      if (!formData.email || !formData.password) {
        setError('Lütfen tüm alanları doldurun');
        return;
      }

      // Basit bir doğrulama - gerçek uygulamada API'ye istek atılacak
      if (formData.email === 'demo@example.com' && formData.password === 'demo123') {
        onLogin({ email: formData.email, name: 'Demo Kullanıcı' });
        navigate('/dashboard');
      } else {
        setError('Geçersiz e-posta veya şifre');
      }
    } else {
      // Kayıt işlemi
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        setError('Lütfen tüm alanları doldurun');
        return;
      }

      // Gerçek uygulamada API'ye kayıt isteği atılacak
      // Burada başarılı olduğunu varsayalım
      setIsLogin(true);
      setError('');
      setFormData({
        ...formData,
        password: ''
      });
      // Başarılı kayıt mesajı göster
      alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {!isLogin && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  required
                  fullWidth
                  label="Ad"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  required
                  fullWidth
                  label="Soyad"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posta Adresi"
            name="email"
            autoComplete="email"
            autoFocus={isLogin}
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
            sx={{ mt: 3, mb: 2 }}
          >
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="#" variant="body2" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Hesabınız var mı? Giriş yapın'}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 