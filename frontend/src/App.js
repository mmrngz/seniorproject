import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Alert, Snackbar } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Bileşenler
import Header from './components/Header';

// Sayfalar
import HomePage from './pages/HomePage';
import AllStocksPage from './pages/AllStocksPage';
import PotentialRisersPage from './pages/PotentialRisersPage';
import DashboardPage from './pages/DashboardPage';
import StockDetailPage from './pages/StockDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import ModelComparisonPage from './pages/ModelComparisonPage';

// Servisler
import userService from './services/userService';

// Varsayılan olarak koyu tema kullan
const prefersDarkMode = true;

const App = () => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // LocalStorage'dan kullanıcı bilgilerini yükle
  useEffect(() => {
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);
  
  // Giriş işlemi
  const handleLogin = (userData) => {
    setUser(userData);
    showNotification('Başarıyla giriş yapıldı!', 'success');
  };
  
  // Çıkış işlemi
  const handleLogout = () => {
    userService.logout();
    setUser(null);
    showNotification('Çıkış yapıldı', 'info');
  };
  
  // Bildirim gösterme
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // Bildirim kapatma
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Modern borsalar için ultra modern tema oluştur
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2962FF', // Canlı mavi
        light: '#5B8DEF',
        dark: '#0039CB',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#26A69A', // Türkuaz yeşil
        light: '#64D8CB',
        dark: '#00766C',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#00C853', // Yükseliş
        light: '#69F0AE',
        dark: '#00A045',
      },
      error: {
        main: '#F44336', // Düşüş
        light: '#FF7961',
        dark: '#BA000D',
      },
      warning: {
        main: '#FF9800', // Uyarı turuncu
        light: '#FFB74D',
        dark: '#C77800',
      },
      info: {
        main: '#03A9F4', // Bilgi mavisi
        light: '#4FC3F7',
        dark: '#0276AA',
      },
      background: {
        paper: darkMode ? 'rgba(25, 25, 35, 0.8)' : '#FFFFFF',
        default: darkMode ? '#131722' : '#F8F9FC',
      },
      text: {
        primary: darkMode ? '#E0E0E0' : '#252525',
        secondary: darkMode ? '#9598A1' : '#787B86',
      },
      action: {
        active: darkMode ? '#4B5FFF' : '#2962FF',
        hover: darkMode ? 'rgba(75, 95, 255, 0.08)' : 'rgba(41, 98, 255, 0.08)',
        hoverOpacity: 0.1,
        selected: darkMode ? 'rgba(75, 95, 255, 0.16)' : 'rgba(41, 98, 255, 0.16)',
        disabled: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        disabledBackground: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      body1: {
        fontSize: '0.95rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
      caption: {
        fontSize: '0.75rem',
        letterSpacing: '0.4px',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode 
              ? 'rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.2)'
              : 'rgba(0, 0, 0, 0.2) rgba(255, 255, 255, 0.2)',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: darkMode ? '0px 4px 20px rgba(0, 0, 0, 0.3)' : '0px 4px 20px rgba(0, 0, 0, 0.08)',
            ...(darkMode && {
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))',
            }),
          },
          elevation0: {
            boxShadow: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
            },
          },
          containedPrimary: {
            background: darkMode 
              ? 'linear-gradient(135deg, #4B5FFF 0%, #2962FF 100%)' 
              : 'linear-gradient(135deg, #2962FF 0%, #0039CB 100%)',
            color: '#FFFFFF',
          },
          outlinedPrimary: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 0.2s, background-color 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundColor: darkMode 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            padding: '12px 16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: darkMode ? 'rgba(15, 15, 25, 0.9)' : '#F5F5F5',
            color: darkMode ? '#E0E0E0' : '#252525',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(30, 30, 45, 0.9)' : 'rgba(240, 247, 255, 0.9)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            height: 28,
            fontWeight: 500,
            '&.MuiChip-colorPrimary': {
              background: darkMode 
                ? 'linear-gradient(135deg, #4B5FFF 0%, #2962FF 100%)' 
                : 'linear-gradient(135deg, #2962FF 0%, #0039CB 100%)',
            },
            '&.MuiChip-colorSuccess': {
              background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
            },
            '&.MuiChip-colorError': {
              background: 'linear-gradient(135deg, #FF5252 0%, #F44336 100%)',
            },
          },
          deleteIcon: {
            color: 'inherit',
            opacity: 0.7,
            '&:hover': {
              opacity: 1,
              color: 'inherit',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: 'hidden',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          standardSuccess: {
            backgroundColor: darkMode ? 'rgba(0, 200, 83, 0.15)' : 'rgba(0, 200, 83, 0.1)',
            color: darkMode ? '#69F0AE' : '#00A045',
          },
          standardError: {
            backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.1)',
            color: darkMode ? '#FF7961' : '#BA000D',
          },
          standardWarning: {
            backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
            color: darkMode ? '#FFB74D' : '#C77800',
          },
          standardInfo: {
            backgroundColor: darkMode ? 'rgba(3, 169, 244, 0.15)' : 'rgba(3, 169, 244, 0.1)',
            color: darkMode ? '#4FC3F7' : '#0276AA',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 6,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
            '& .MuiSwitch-switchBase': {
              padding: 1,
              '&.Mui-checked': {
                transform: 'translateX(16px)',
                '& + .MuiSwitch-track': {
                  opacity: 1,
                  backgroundColor: darkMode ? '#2962FF' : '#2962FF',
                },
              },
            },
            '& .MuiSwitch-thumb': {
              width: 24,
              height: 24,
            },
            '& .MuiSwitch-track': {
              opacity: 1,
              borderRadius: 13,
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)',
            },
          },
        },
      },
    },
  });
  
  // Tema değiştirme
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          width: '100%',
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          background: darkMode 
            ? 'linear-gradient(180deg, #131722 0%, #1C1F2D 100%)' 
            : 'linear-gradient(180deg, #F8F9FC 0%, #EEF1F8 100%)',
          backgroundAttachment: 'fixed'
        }}>
          <Header isLoggedIn={!!user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          
          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            {/* Ana Sayfa */}
            <Route path="/" element={<HomePage />} />
            
            {/* Hisse Sayfaları */}
            <Route path="/all-stocks" element={<AllStocksPage />} />
            <Route path="/potential-risers" element={<PotentialRisersPage />} />
            <Route path="/stocks/:symbol" element={<StockDetailPage />} />
            
            {/* Giriş/Kayıt Sayfaları */}
            <Route path="/login" element={
              user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/dashboard" /> : <RegisterPage />
            } />
            
            {/* Kullanıcı Sayfaları */}
            <Route path="/dashboard" element={
              user ? <DashboardPage /> : <Navigate to="/login" />
            } />
            <Route path="/favorites" element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } />
            <Route path="/settings" element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } />
            
            {/* Tahmin Geçmişi Sayfası */}
            <Route path="/prediction-history" element={
              user ? <PredictionHistoryPage /> : <Navigate to="/login" />
            } />
            
            {/* Model Karşılaştırma Sayfası */}
            <Route path="/model-comparison" element={
              user ? <ModelComparisonPage /> : <Navigate to="/login" />
            } />
            
            {/* Bulunamayan sayfalar için ana sayfaya yönlendir */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </Box>
          
          {/* Bildirimler */}
          <Snackbar 
            open={notification.open} 
            autoHideDuration={6000} 
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 