import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Bileşenler
import Header from './components/Header';
import Login from './components/Login';

// Sayfalar
import HomePage from './pages/HomePage';
import AllStocksPage from './pages/AllStocksPage';
import PotentialRisersPage from './pages/PotentialRisersPage';
import DashboardPage from './pages/DashboardPage';

// Örnek bir kullanıcı tema tercihi (gerçek uygulamada localStorage veya API'dan alınabilir)
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

const App = () => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  
  // Tema oluştur
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });
  
  // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  // Giriş işlemi
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  // Çıkış işlemi
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  // Tema değiştirme
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box>
          <Header isLoggedIn={!!user} onLogout={handleLogout} />
          
          <Routes>
            {/* Ana Sayfa */}
            <Route path="/" element={<HomePage />} />
            
            {/* Hisse Sayfaları */}
            <Route path="/all-stocks" element={<AllStocksPage />} />
            <Route path="/potential-risers" element={<PotentialRisersPage />} />
            
            {/* Kullanıcı Sayfaları */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} 
            />
            
            {/* Bulunamayan sayfalar için ana sayfaya yönlendir */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 