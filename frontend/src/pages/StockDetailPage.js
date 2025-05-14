import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress, 
  Button, 
  Card, 
  CardContent,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  useTheme,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { alpha } from '@mui/material/styles';

import apiService from '../services/api';

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Tab panel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stock-tabpanel-${index}`}
      aria-labelledby={`stock-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StockDetailPage = () => {
  const { symbol } = useParams(); // URL'den sembolü al
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [stock, setStock] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1mo');
  const [loadingChart, setLoadingChart] = useState(false);
  
  // Sayfa yüklendiğinde hisse verisini ve tahminlerini çek
  useEffect(() => {
    fetchStockData();
    
    // Favori bilgisini localStorage'dan al
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    setFavorite(!!favorites[symbol]);
  }, [symbol]);
  
  // Hisse verilerini ve tahminleri çek
  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Hisse temel bilgilerini çek
      const stockResponse = await apiService.getStockBySymbol(symbol);
      setStock(stockResponse.data);
      
      // Hisse tahmin bilgilerini çek
      const predictionResponse = await apiService.getPredictionBySymbol(symbol, refreshing);
      setPrediction(predictionResponse.data);
      
      // Grafik verilerini de çek
      fetchChartData();
      
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError(`Hisse verileri yüklenirken bir hata oluştu: ${err.message}`);
      console.error('Hata:', err);
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Grafik verilerini çek
  const fetchChartData = async () => {
    try {
      setLoadingChart(true);
      const days = chartPeriod === '1wk' ? 7 : chartPeriod === '1mo' ? 30 : 90;
      const response = await apiService.getHourlyData(symbol, days);
      
      if (response.data.success) {
        prepareChartData(response.data.data);
      } else {
        console.error('Grafik verileri çekilemedi:', response.data.message);
      }
      setLoadingChart(false);
    } catch (err) {
      console.error('Grafik verileri çekilirken hata:', err);
      setLoadingChart(false);
    }
  };
  
  // Grafik verilerini hazırla
  const prepareChartData = (data) => {
    if (!data || data.length === 0) return;
    
    // Son 24 saat için tahmin verilerini hazırla
    const predictionDates = [];
    const predictionValues = [];
    
    if (prediction && prediction.predictions && prediction.predictions.lstm) {
      const now = new Date();
      const lastDataDate = new Date(data[data.length - 1].Datetime);
      
      for (let i = 0; i < prediction.predictions.lstm.length; i++) {
        // Son veri tarihinden i saat sonrası
        const nextDate = new Date(lastDataDate);
        nextDate.setHours(nextDate.getHours() + i + 1);
        
        // Sadece iş saatleri (10:00-18:00 arası)
        if (nextDate.getHours() >= 10 && nextDate.getHours() < 18) {
          predictionDates.push(nextDate.toLocaleString());
          predictionValues.push(prediction.predictions.lstm[i]);
        }
      }
    }
    
    // Geçmiş verileri hazırla
    const dates = data.map(item => new Date(item.Datetime).toLocaleString());
    const prices = data.map(item => item.Close);
    
    // Grafik verilerini ayarla
    setChartData({
      labels: [...dates, ...predictionDates],
      datasets: [
        {
          label: 'Geçmiş Fiyat',
          data: [...prices, null, null], // Son iki değer null, tahmin bölümüne boşluk bırakmak için
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Tahmin (LSTM)',
          data: [...Array(prices.length).fill(null), ...predictionValues], // Geçmiş değerler için null, sadece tahminleri göstermek için
          borderColor: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.main, 0.1),
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        }
      ]
    });
  };
  
  // Periyot değişikliği
  const handlePeriodChange = (event) => {
    setChartPeriod(event.target.value);
  };
  
  // Periyot değişince grafik verilerini güncelle
  useEffect(() => {
    if (symbol) {
      fetchChartData();
    }
  }, [chartPeriod, symbol]);
  
  // Yenile
  const handleRefresh = () => {
    setRefreshing(true);
    fetchStockData();
  };
  
  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Favorilere ekle/çıkar
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    
    if (favorite) {
      delete favorites[symbol];
    } else {
      favorites[symbol] = true;
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    setFavorite(!favorite);
  };
  
  // Logo URL'sini oluştur
  const getLogoUrl = (symbol) => {
    if (!symbol) return '';
    const upperSymbol = symbol.toUpperCase();
    return `https://cdn.jsdelivr.net/gh/ahmeterenodaci/Istanbul-Stock-Exchange--BIST--including-symbols-and-logos/logos/${upperSymbol}.png`;
  };
  
  // Logo yükleme hatası durumunda
  const handleLogoError = () => {
    setLogoError(true);
  };
  
  // Sembol için renkli arka plan oluştur (avatar için)
  const getSymbolColor = (symbol) => {
    if (!symbol) return '#f5f5f5';
    
    // Sembolü hash'e çevir
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Hash'ten renk oluştur
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };
  
  // Değişim yüzdesine göre renk belirle
  const getChangeColor = (change) => {
    if (!change && change !== 0) return 'text.secondary';
    return change >= 0 ? 'success.main' : 'error.main';
  };

  // İkon seç
  const getChangeIcon = (change) => {
    if (!change && change !== 0) return null;
    return change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };
  
  // RSI için ilerleme çubuğu rengi
  const getRsiProgressColor = (rsi) => {
    if (rsi >= 70) return theme.palette.error.main;
    if (rsi >= 50) return theme.palette.warning.main; 
    if (rsi >= 30) return theme.palette.success.main;
    return theme.palette.error.main; // < 30 aşırı satış
  };
  
  // Hacmi formatlama
  const formatVolume = (volume) => {
    if (!volume) return '0';
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <Box sx={{ 
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      overflow: 'hidden',
      p: 0
    }}>
      <Container maxWidth="xl" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: {xs: 0.5, sm: 1}, overflow: 'hidden' }}>
        {/* Üst Bar */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 1, 
            p: {xs: 1, sm: 1.5},
            borderRadius: {xs: 0, sm: 2},
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.8)' : 'white',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={() => navigate(-1)}
                size="small"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Hisse Detayı
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
              >
                {refreshing ? 'Yenileniyor...' : 'Yenile'}
              </Button>
              
              <IconButton 
                color={favorite ? 'warning' : 'default'}
                onClick={toggleFavorite}
              >
                {favorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Box>
          </Box>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, flexGrow: 1 }}>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {symbol} hisse verileri yükleniyor...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Hisse Özeti */}
            <Paper 
              elevation={0} 
              sx={{ 
                mb: 1, 
                p: {xs: 2, sm: 3},
                borderRadius: {xs: 0, sm: 2},
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.8)' : 'white',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 24px rgba(0,0,0,0.2)' 
                  : '0 4px 12px rgba(0,0,0,0.05)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Grid container spacing={3}>
                {/* Logo ve Sembol */}
                <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: {xs: 100, sm: 120}, 
                      height: {xs: 100, sm: 120}, 
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    {!logoError ? (
                      <img
                        src={getLogoUrl(symbol)}
                        alt={symbol}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={handleLogoError}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: '80%',
                          height: '80%',
                          bgcolor: getSymbolColor(symbol),
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {symbol?.substring(0, 2)}
                      </Avatar>
                    )}
                  </Box>
                  
                  <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {symbol}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                    {stock?.name || "BIST Hissesi"}
                  </Typography>
                  
                  <Chip
                    color="primary"
                    variant="outlined"
                    label="BIST Hissesi"
                    size="small"
                  />
                </Grid>
                
                {/* Fiyat ve Değişim */}
                <Grid item xs={12} sm={8} md={4}>
                  <Typography variant="overline" color="text.secondary">
                    Güncel Fiyat
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
                    {Number(stock?.current_price || stock?.last_price).toFixed(2)} ₺
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Chip
                      icon={getChangeIcon(stock?.daily_change || prediction?.lstm_change_percent)}
                      label={`%${Math.abs((stock?.daily_change || prediction?.lstm_change_percent || 0)).toFixed(2)}`}
                      color={stock?.daily_change || prediction?.lstm_change_percent >= 0 ? "success" : "error"}
                      sx={{ fontWeight: 'bold' }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      son 24 saatte
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Açılış
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {Number(stock?.open_price || 0).toFixed(2)} ₺
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Hacim
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {formatVolume(stock?.volume)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Günlük En Yüksek
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {Number(stock?.high_price || 0).toFixed(2)} ₺
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Günlük En Düşük
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {Number(stock?.low_price || 0).toFixed(2)} ₺
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Tahmin ve Göstergeler */}
                <Grid item xs={12} md={5}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderRadius: 2,
                      height: '100%'
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Tahmin ve Göstergeler
                    </Typography>
                    
                    {prediction ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            En İyi Model: {(prediction.best_model || '').toUpperCase()}
                          </Typography>
                          <Typography variant="h5" color={getChangeColor(prediction.lstm_change_percent)} sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 2 }}>
                            {getChangeIcon(prediction.lstm_change_percent)}
                            {Number(prediction.lstm_predicted_price || 0).toFixed(2)} ₺
                            <Typography variant="body2" color={getChangeColor(prediction.lstm_change_percent)} sx={{ ml: 1 }}>
                              (%{(prediction.lstm_change_percent || 0).toFixed(2)})
                            </Typography>
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            LSTM
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: getChangeColor(prediction.lstm_change_percent) }}>
                            {Number(prediction.lstm_predicted_price || 0).toFixed(2)} ₺ (%{(prediction.lstm_change_percent || 0).toFixed(2)})
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            GRU
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: getChangeColor(prediction.gru_change_percent) }}>
                            {Number(prediction.gru_predicted_price || 0).toFixed(2)} ₺ (%{(prediction.gru_change_percent || 0).toFixed(2)})
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            RSI
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ flex: 1, mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={stock?.rsi || 50} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 1,
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: getRsiProgressColor(stock?.rsi)
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', width: 35 }}>
                              {(stock?.rsi || 0).toFixed(0)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Bağıl Hacim
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {(stock?.relative_volume || 0).toFixed(2)}x
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Tahmin bilgisi bulunamadı
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Tab Menüsü ve İçerik */}
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: {xs: 0, sm: 2},
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.8)' : 'white',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 24px rgba(0,0,0,0.2)' 
                  : '0 4px 12px rgba(0,0,0,0.05)',
                backdropFilter: 'blur(10px)',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab 
                    label="Grafik" 
                    icon={<ShowChartIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="İndikatörler" 
                    icon={<BarChartIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Analiz" 
                    icon={<AssessmentIcon />} 
                    iconPosition="start"
                  />
                  <Tab 
                    label="Tahminler" 
                    icon={<TimelineIcon />} 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {symbol} Fiyat Grafiği
                      </Typography>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Periyot</InputLabel>
                        <Select
                          value={chartPeriod}
                          label="Periyot"
                          onChange={handlePeriodChange}
                        >
                          <MenuItem value="1wk">1 Hafta</MenuItem>
                          <MenuItem value="1mo">1 Ay</MenuItem>
                          <MenuItem value="3mo">3 Ay</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    
                    {loadingChart ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <CircularProgress size={30} thickness={4} />
                      </Box>
                    ) : chartData ? (
                      <Box sx={{ height: 'calc(100% - 50px)', minHeight: '300px', p: 1 }}>
                        <Line 
                          data={chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  usePointStyle: true,
                                  boxWidth: 6
                                }
                              },
                              tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                  label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' ₺';
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                grid: {
                                  display: false
                                },
                                ticks: {
                                  maxRotation: 0,
                                  maxTicksLimit: 8
                                }
                              },
                              y: {
                                grid: {
                                  color: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.1)'
                                }
                              }
                            },
                            interaction: {
                              mode: 'index',
                              intersect: false
                            },
                            elements: {
                              point: {
                                radius: 0,
                                hoverRadius: 5
                              }
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <Typography variant="body1" color="text.secondary">
                          Grafik verisi bulunamadı
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Tahmin Açıklaması
                      </Typography>
                      
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Bu grafik, {symbol} hissesinin geçmiş fiyat verileri ile yapay zeka modelimiz tarafından üretilen 
                          gelecek fiyat tahminlerini göstermektedir. Mavi çizgi geçmiş fiyatları, yeşil kesikli çizgi ise 
                          LSTM modeli ile yapılan tahminleri temsil eder.
                        </Typography>
                        
                        {prediction && prediction.best_model && (
                          <Box sx={{ mt: 2 }}>
                            <Chip 
                              label={`En iyi model: ${prediction.best_model.toUpperCase()}`} 
                              color="primary" 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`Doğruluk: ${(100 - (prediction.best_mse * 100)).toFixed(1)}%`} 
                              color="success" 
                              size="small" 
                            />
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body1">
                      İndikatörler paneli burada gelecek
                    </Typography>
                  </Box>
                </TabPanel>
                
                <TabPanel value={tabValue} index={2}>
                  <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body1">
                      Analiz paneli burada gelecek
                    </Typography>
                  </Box>
                </TabPanel>
                
                <TabPanel value={tabValue} index={3}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>
                      Model Tahminleri ve Karşılaştırmaları
                    </Typography>
                    
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : !prediction ? (
                      <Alert severity="info">
                        Bu hisse için tahmin bilgisi bulunamadı.
                      </Alert>
                    ) : (
                      <>
                        <Grid container spacing={3}>
                          {/* LSTM Modeli */}
                          <Grid item xs={12} md={4}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 2, 
                                height: '100%',
                                borderRadius: 2,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.9)' : 'white',
                                border: `1px solid ${theme.palette.primary.main}`,
                                borderLeftWidth: 4
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                <TimelineIcon sx={{ mr: 1 }} /> LSTM Modeli
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Tahmini Fiyat
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: getChangeColor(prediction.lstm_change_percent) }}>
                                  {Number(prediction.lstm_predicted_price || 0).toFixed(2)} ₺
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  {getChangeIcon(prediction.lstm_change_percent)}
                                  <Typography 
                                    variant="body2"
                                    sx={{ color: getChangeColor(prediction.lstm_change_percent), fontWeight: 'medium' }}
                                  >
                                    %{Math.abs(prediction.lstm_change_percent || 0).toFixed(2)}
                                    {prediction.lstm_change_percent >= 0 ? ' artış' : ' düşüş'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Divider sx={{ my: 2 }} />
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Model Metrikleri
                              </Typography>
                              
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    MSE
                                  </Typography>
                                  <Typography variant="body2">
                                    {prediction.lstm_mse?.toFixed(6) || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    MAE
                                  </Typography>
                                  <Typography variant="body2">
                                    {prediction.lstm_mae?.toFixed(6) || 'N/A'}
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              {prediction.best_model === 'lstm' && (
                                <Chip 
                                  label="En İyi Model" 
                                  color="success" 
                                  size="small" 
                                  sx={{ mt: 2 }}
                                />
                              )}
                            </Paper>
                          </Grid>
                          
                          {/* GRU Modeli */}
                          <Grid item xs={12} md={4}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 2, 
                                height: '100%',
                                borderRadius: 2,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.9)' : 'white',
                                border: `1px solid ${theme.palette.secondary.main}`,
                                borderLeftWidth: 4
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main', display: 'flex', alignItems: 'center' }}>
                                <TimelineIcon sx={{ mr: 1 }} /> GRU Modeli
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Tahmini Fiyat
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: getChangeColor(prediction.gru_change_percent) }}>
                                  {Number(prediction.gru_predicted_price || 0).toFixed(2)} ₺
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  {getChangeIcon(prediction.gru_change_percent)}
                                  <Typography 
                                    variant="body2"
                                    sx={{ color: getChangeColor(prediction.gru_change_percent), fontWeight: 'medium' }}
                                  >
                                    %{Math.abs(prediction.gru_change_percent || 0).toFixed(2)}
                                    {prediction.gru_change_percent >= 0 ? ' artış' : ' düşüş'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Divider sx={{ my: 2 }} />
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Model Metrikleri
                              </Typography>
                              
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    MSE
                                  </Typography>
                                  <Typography variant="body2">
                                    {prediction.gru_mse?.toFixed(6) || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    MAE
                                  </Typography>
                                  <Typography variant="body2">
                                    {prediction.gru_mae?.toFixed(6) || 'N/A'}
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              {prediction.best_model === 'gru' && (
                                <Chip 
                                  label="En İyi Model" 
                                  color="success" 
                                  size="small" 
                                  sx={{ mt: 2 }}
                                />
                              )}
                            </Paper>
                          </Grid>
                          
                          {/* Attention Modeli */}
                          <Grid item xs={12} md={4}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 2, 
                                height: '100%',
                                borderRadius: 2,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.9)' : 'white',
                                border: `1px solid ${theme.palette.info.main}`,
                                borderLeftWidth: 4
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'info.main', display: 'flex', alignItems: 'center' }}>
                                <TimelineIcon sx={{ mr: 1 }} /> Attention Modeli
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Tahmini Fiyat
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: getChangeColor(prediction.attention_change_percent) }}>
                                  {Number(prediction.attention_predicted_price || 0).toFixed(2)} ₺
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  {getChangeIcon(prediction.attention_change_percent)}
                                  <Typography 
                                    variant="body2"
                                    sx={{ color: getChangeColor(prediction.attention_change_percent), fontWeight: 'medium' }}
                                  >
                                    %{Math.abs(prediction.attention_change_percent || 0).toFixed(2)}
                                    {prediction.attention_change_percent >= 0 ? ' artış' : ' düşüş'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Divider sx={{ my: 2 }} />
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Model Metrikleri
                              </Typography>
                              
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    MSE
                                  </Typography>
                                  <Typography variant="body2">
                                    {prediction.attention_mse?.toFixed(6) || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    MAE
                                  </Typography>
                                  <Typography variant="body2">
                                    {prediction.attention_mae?.toFixed(6) || 'N/A'}
                                  </Typography>
                                </Grid>
                              </Grid>
                              
                              {prediction.best_model === 'attention' && (
                                <Chip 
                                  label="En İyi Model" 
                                  color="success" 
                                  size="small" 
                                  sx={{ mt: 2 }}
                                />
                              )}
                            </Paper>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 4 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Tahmin Açıklaması
                          </Typography>
                          
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 3, 
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="body2" gutterBottom>
                              <strong>{symbol}</strong> hissesi için üç farklı derin öğrenme modeli kullanılarak tahminler yapılmıştır. 
                              Bu modellerin her biri farklı mimarilere sahip olup, zaman serisi verilerinin farklı yönlerini analiz etmektedir.
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mt: 2 }}>
                              Bu tahminler son {prediction.features_used?.length || '10+'} farklı teknik gösterge kullanılarak, 
                              {prediction.training_window || '30'} adet veri noktası üzerinden eğitilmiş modellerle yapılmıştır.
                              En iyi performans gösteren model <strong>{prediction.best_model?.toUpperCase() || 'LSTM'}</strong> olarak belirlenmiştir.
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                              Not: Tahminler sadece bilgi amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. 
                              Gerçek sonuçlar piyasa koşullarına ve diğer faktörlere bağlı olarak değişiklik gösterebilir.
                            </Typography>
                          </Paper>
                        </Box>
                      </>
                    )}
                  </Box>
                </TabPanel>
              </Box>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
};

export default StockDetailPage; 