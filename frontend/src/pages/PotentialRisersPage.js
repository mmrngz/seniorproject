import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Alert, 
  Button,
  Grid,
  IconButton,
  Snackbar,
  useTheme,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip,
  Card,
  CardContent,
  useMediaQuery,
  Fade,
  Backdrop,
  LinearProgress,
  Avatar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StockCard from '../components/StockCard';
import apiService from '../services/api';

const PotentialRisersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [noPredictions, setNoPredictions] = useState(false);
  const [forcePredictions, setForcePredictions] = useState(false);

  useEffect(() => {
    fetchPotentialRisers();
  }, []);

  const fetchPotentialRisers = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError('');
      setNoPredictions(false);

      // force parametresi ile zorlama tahmini yaptırabiliyoruz
      const response = await apiService.getPotentialRisers(forcePredictions);

      if (response && response.data) {
        if (response.data.length === 0) {
          setSnackbarMessage('Potansiyel yükselişçi hisse bulunamadı.');
          setSnackbarOpen(true);
        } else {
          // Geçerli tahminleri olan hisseleri filtrele
          const validStocks = response.data.filter(stock => 
            stock && stock.prediction && stock.prediction.price_target
          );

          if (validStocks.length === 0 && response.data.length > 0) {
            setNoPredictions(true);
            setSnackbarMessage('Tahminler hazırlanıyor, biraz zaman alabilir.');
            setSnackbarOpen(true);
          }

          setStocks(response.data);
        }
      } else {
        setError('Sunucudan geçerli bir yanıt alınamadı.');
      }

      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Hata:', err);
      setError('Veri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPotentialRisers();
  };

  return (
    <Box sx={{ 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(18,18,28,0.95)' : '#f8f9fc',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column', 
      width: '100%',
      minHeight: '100vh',
      overflow: 'auto',
      p: 0
    }}>
      {/* Hero Bölümü - Daha geniş ve daha belirgin */}
      <Box 
        sx={{ 
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.15)' : 'rgba(25,118,210,0.05)',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          py: { xs: 5, md: 6 },
          mb: 4,
          backgroundImage: theme.palette.mode === 'dark' 
            ? 'linear-gradient(180deg, rgba(21,101,192,0.15) 0%, rgba(18,18,28,0) 100%)'
            : 'linear-gradient(180deg, rgba(227,242,253,0.8) 0%, rgba(248,249,252,0) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 10px 30px -10px rgba(0,0,0,0.3)' 
            : '0 10px 30px -10px rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)',
                    width: { xs: 56, md: 70 },
                    height: { xs: 56, md: 70 },
                    mr: 2.5,
                    boxShadow: '0 0 20px rgba(33,150,243,0.3)'
                  }}
                >
                  <TrendingUpIcon 
                    sx={{ 
                      fontSize: { xs: 32, md: 40 }, 
                      color: theme.palette.primary.main,
                    }} 
                  />
                </Avatar>
                <Typography 
                  variant={isMobile ? "h4" : "h3"} 
                  fontWeight="bold" 
                  sx={{ 
                    letterSpacing: '-0.5px',
                    backgroundImage: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #90caf9, #42a5f5)'
                      : 'linear-gradient(90deg, #1976d2, #2196f3)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    textShadow: theme.palette.mode === 'dark' ? '0 0 30px rgba(33,150,243,0.3)' : 'none',
                    maxWidth: '100%',
                    overflow: 'visible',
                    whiteSpace: 'normal'
                  }}
                >
                  Potansiyel Yükselişçiler
                </Typography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 400, opacity: 0.9, maxWidth: '90%' }}>
                Yapay zeka modellerimiz tarafından belirlenen, yükseliş potansiyeli taşıyan BIST hisseleri
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  icon={<WatchLaterIcon />} 
                  label={`Son güncelleme: ${lastUpdated ? lastUpdated.toLocaleString('tr-TR') : 'Bilinmiyor'}`}
                  variant="outlined"
                  color="primary"
                  sx={{ 
                    borderRadius: 2,
                    px: 1,
                    height: 36,
                    borderWidth: 1.5,
                    '& .MuiChip-icon': { color: theme.palette.primary.main }
                  }}
                />
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 2,
                mb: 2
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  startIcon={refreshing ? <SyncIcon className="rotating" /> : <RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    boxShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(33,150,243,0.3)' : '0 4px 12px rgba(25,118,210,0.2)',
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 120
                  }}
                >
                  Yenile
                </Button>
                
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(35,35,50,0.5)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={forcePredictions} 
                        onChange={(e) => setForcePredictions(e.target.checked)}
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: theme.palette.primary.main,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Tahminleri Zorla
                      </Typography>
                    }
                  />
                  <Tooltip title="Tahminleri zorla seçeneği, tahminlerin hemen yeniden hesaplanmasını sağlar." arrow>
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>
                
                {refreshing && (
                  <CircularProgress size={24} thickness={4} />
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                position: 'relative',
                height: '100%',
                minHeight: '200px'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  width: '300px',
                  height: '300px',
                  background: theme.palette.mode === 'dark' 
                    ? 'radial-gradient(circle, rgba(33,150,243,0.2) 0%, rgba(18,18,28,0) 70%)'
                    : 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, rgba(248,249,252,0) 70%)',
                  borderRadius: '50%',
                  filter: 'blur(30px)',
                  zIndex: 0
                }} />
                
                <Box sx={{ 
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'float 6s ease-in-out infinite'
                }}>
                  <ShowChartIcon sx={{ 
                    fontSize: 140, 
                    color: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.25)' : 'rgba(33,150,243,0.15)',
                    mb: 2,
                    filter: 'drop-shadow(0 10px 15px rgba(33,150,243,0.2))'
                  }} />
                  <Typography variant="h6" color="primary" fontWeight="medium" textAlign="center">
                    Derin öğrenme ile tahminler
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    LSTM, GRU ve Attention modelleri
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      <Container maxWidth="lg">
        {/* Ana İçerik - Yükselişçi Hisseler Kart Görünümü */}
        <Box sx={{ mb: 6 }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '400px',
              py: 10
            }}>
              <CircularProgress size={60} thickness={4} color="primary" />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 3, fontWeight: 500 }}>
                Potansiyel yükselişçiler yükleniyor...
              </Typography>
              <LinearProgress 
                sx={{ 
                  mt: 4, 
                  width: '250px', 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }} 
              />
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              variant="filled"
              sx={{ 
                borderRadius: 2, 
                mb: 3
              }}
            >
              {error}
            </Alert>
          ) : (
            <>
              {stocks.length > 0 ? (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', md: 'center' },
                    mb: 4,
                    pb: 2,
                    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ mr: 2 }}>
                        {stocks.length} adet potansiyel yükselişçi hisse
                      </Typography>
                      <Tooltip title="Bu hisseler yapay zeka modellerimiz tarafından yükseliş potansiyeli taşıdığı öngörülen hisselerdir. Yatırım tavsiyesi değildir." arrow>
                        <IconButton size="small">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mt: { xs: 2, md: 0 },
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.4)' : 'rgba(255,255,255,0.8)',
                      borderRadius: 2,
                      p: 1,
                      boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        Not: Burada sunulan bilgiler yatırım tavsiyesi değildir.
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Fade in={true} timeout={800}>
                    <Grid container spacing={3}>
                      {stocks.map((stock, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={stock.symbol}>
                          <Fade in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                            <Box>
                              <StockCard stock={stock} />
                            </Box>
                          </Fade>
                        </Grid>
                      ))}
                    </Grid>
                  </Fade>
                  
                  {/* Alt Bilgi Kartı - Daha modern */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      mt: 6, 
                      p: 3, 
                      borderRadius: 4,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(35,35,50,0.5)' : 'white',
                      boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        width: '200px', 
                        height: '200px', 
                        borderRadius: '50%',
                        background: theme.palette.mode === 'dark' ? 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(33,150,243,0.05) 0%, rgba(255,255,255,0) 70%)',
                        top: '-100px',
                        right: '-50px',
                        zIndex: 0
                      }} 
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 }, zIndex: 1 }}>
                      <ShowChartIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          Derin öğrenme modelleri ile tahmin
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          LSTM, GRU ve Attention modelleri kullanılarak oluşturulan tahminler
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={handleRefresh}
                      startIcon={<RefreshIcon />}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        fontWeight: 500,
                        borderWidth: 1.5,
                        zIndex: 1
                      }}
                    >
                      Tahminleri Güncelle
                    </Button>
                  </Paper>
                </>
              ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    p: 5,
                    height: '100%',
                    minHeight: '400px',
                    borderRadius: 4,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(35,35,50,0.5)' : 'white',
                    boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      width: '300px', 
                      height: '300px', 
                      borderRadius: '50%',
                      background: theme.palette.mode === 'dark' ? 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(33,150,243,0.05) 0%, rgba(255,255,255,0) 70%)',
                      top: '-150px',
                      right: '-150px',
                      zIndex: 0
                    }} 
                  />
                  
                  <ShowChartIcon sx={{ 
                    fontSize: 100, 
                    color: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.15)' : 'rgba(33,150,243,0.1)',
                    mb: 3
                  }} />
                  
                  <Typography variant="h5" color="text.secondary" sx={{ mb: 2, fontWeight: 500, zIndex: 1 }}>
                    Potansiyel yükselişçi hisse bulunamadı
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: '500px', zIndex: 1 }}>
                    Şu anda potansiyel yükseliş gösteren hisse bulunmuyor veya tahminler henüz hazır değil.
                    Yenilemeyi deneyebilir veya daha sonra tekrar kontrol edebilirsiniz.
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleRefresh} 
                    sx={{ 
                      mt: 2, 
                      borderRadius: 2,
                      px: 4,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(33,150,243,0.3)' : '0 4px 12px rgba(25,118,210,0.2)',
                      zIndex: 1
                    }}
                    startIcon={<RefreshIcon />}
                    size="large"
                  >
                    Yenile
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Container>
      
      {/* Bildirim */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      
      {/* CSS - Dönen Simge Animasyonu ve Float Animasyonu */}
      <style jsx="true">{`
        .rotating {
          animation: rotate 1s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </Box>
  );
};

export default PotentialRisersPage; 