import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  TextField,
  Button,
  InputAdornment,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  useTheme,
  Grid,
  Card,
  CardContent,
  Divider,
  Fade,
  Tooltip,
  Backdrop,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Switch,
  FormControlLabel,
  Badge
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SyncIcon from '@mui/icons-material/Sync';
import StarIcon from '@mui/icons-material/Star';
import StockTable from '../components/StockTable';
import apiService from '../services/api';

// Ana Sayfa Bileşeni
const AllStocksPage = () => {
  const theme = useTheme();
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtre panel durumu
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  
  // Filtre seçenekleri
  const [rsiFilter, setRsiFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [changeFilter, setChangeFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [directionFilter, setDirectionFilter] = useState('all');
  
  // Sıralama
  const [sortField, setSortField] = useState('symbol');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchAllStocks();
  }, []);

  // Filtre ve arama değişikliklerini izle
  useEffect(() => {
    applyFilters();
  }, [
    stocks, 
    searchTerm, 
    rsiFilter, 
    volumeFilter, 
    changeFilter, 
    priceRange, 
    showOnlyFavorites,
    directionFilter
  ]);
  
  // Aktif filtre sayısını hesapla
  useEffect(() => {
    let count = 0;
    if (rsiFilter !== 'all') count++;
    if (volumeFilter !== 'all') count++;
    if (changeFilter !== 'all') count++;
    if (directionFilter !== 'all') count++;
    if (showOnlyFavorites) count++;
    if (priceRange[0] > 0 || priceRange[1] < 1000) count++;
    
    setFilterCount(count);
  }, [rsiFilter, volumeFilter, changeFilter, directionFilter, showOnlyFavorites, priceRange]);

  const fetchAllStocks = async () => {
      try {
        setLoading(true);
      // Önce tüm sembolleri çek
      const symbolsResponse = await apiService.getAllSymbols();
      const symbols = symbolsResponse.data;
      
      // Her sembol için detay bilgileri çek
      const stockDetails = [];
      for (let i = 0; i < symbols.length; i += 10) {
        // 10'ar sembol grupla (çok fazla istek yapma)
        const batch = symbols.slice(i, i + 10);
        const batchPromises = batch.map(symbol => apiService.getStockBySymbol(symbol));
        const batchResults = await Promise.all(batchPromises);
        stockDetails.push(...batchResults.map(res => res.data));
      }
      
      setStocks(stockDetails);
        setLastUpdated(new Date());
        setLoading(false);
      setRefreshing(false);
      } catch (err) {
      setError('Hisse senetleri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      console.error('Hata:', err);
        setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllStocks();
  };

  // Filtreleri uygula
  const applyFilters = () => {
    if (!stocks || !stocks.length) {
      setFilteredStocks([]);
      return;
    }

    let result = [...stocks];
    
    // Fiyat aralığı filtresi
    result = result.filter(stock => {
      const price = stock.current_price || stock.last_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // RSI filtresi
    if (rsiFilter !== 'all') {
      if (rsiFilter === 'oversold') {
        result = result.filter(stock => stock.rsi <= 30);
      } else if (rsiFilter === 'neutral') {
        result = result.filter(stock => stock.rsi > 30 && stock.rsi < 70);
      } else if (rsiFilter === 'overbought') {
        result = result.filter(stock => stock.rsi >= 70);
      } else if (rsiFilter === '50-60') {
        result = result.filter(stock => stock.rsi >= 50 && stock.rsi <= 60);
      }
    }
    
    // Hacim filtresi
    if (volumeFilter !== 'all') {
      if (volumeFilter === 'above') {
        result = result.filter(stock => stock.relative_volume >= 1);
      } else if (volumeFilter === 'high') {
        result = result.filter(stock => stock.relative_volume >= 1.5);
      } else if (volumeFilter === 'very-high') {
        result = result.filter(stock => stock.relative_volume >= 2);
      }
    }
    
    // Değişim filtresi
    if (changeFilter !== 'all') {
      if (changeFilter === 'up') {
        result = result.filter(stock => (stock.daily_change || 0) > 0);
      } else if (changeFilter === 'down') {
        result = result.filter(stock => (stock.daily_change || 0) < 0);
      } else if (changeFilter === 'high') {
        result = result.filter(stock => Math.abs(stock.daily_change || 0) >= 2);
      }
    }
    
    // Yön filtresi (potansiyel yükseliş/düşüş)
    if (directionFilter !== 'all') {
      if (directionFilter === 'potential-up') {
        // Potansiyel Yükseliş kriterleri
        result = result.filter(stock => 
          (stock.rsi >= 45 && stock.rsi <= 65) && 
          (stock.relative_volume >= 1.4)
        );
      } else if (directionFilter === 'oversold') {
        // Aşırı satış durumu
        result = result.filter(stock => stock.rsi <= 30);
      }
    }
    
    // Arama filtresi
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(stock => 
        stock.symbol.toLowerCase().includes(searchLower) || 
        (stock.name && stock.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Sadece favorileri göster
    if (showOnlyFavorites) {
      // Not: favorites bilgisini local storage veya state'ten almalısınız
      const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
      result = result.filter(stock => favorites[stock.symbol]);
    }
    
    setFilteredStocks(result);
  };
  
  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setRsiFilter('all');
    setVolumeFilter('all');
    setChangeFilter('all');
    setDirectionFilter('all');
    setPriceRange([0, 1000]);
    setShowOnlyFavorites(false);
    setSearchTerm('');
  };

  // Hisse detay sayfasına git
  const handleStockClick = (stock) => {
    console.log('Seçilen hisse:', stock);
    // Burada detay sayfasına yönlendirme veya modal gösterebilirsiniz
  };
  
  // Filtre panelini aç/kapat
  const toggleFilterPanel = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Box sx={{ 
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(18,18,28,0.95)' : '#f8f9fc',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      overflow: 'hidden',
      p: 0
    }}>
      <Container maxWidth={false} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: {xs: 0.5, sm: 1}, overflow: 'hidden' }}>
        {/* Başlık ve Arama Bölümü */}
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
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <ShowChartIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                BIST Tarama
      </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
      <TextField
                  placeholder="Ara (Ctrl+K)"
        variant="outlined"
                  size="small"
        value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                  sx={{ width: { xs: '100%', sm: 250 } }}
                />
                
                <Tooltip title="Filtreleri Göster/Gizle">
                  <Badge badgeContent={filterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold' } }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<TuneIcon />} 
                      onClick={toggleFilterPanel}
                      size="small"
                      sx={{ 
                        borderRadius: 2,
                        borderColor: showFilters ? theme.palette.primary.main : undefined,
                        backgroundColor: showFilters ? (theme.palette.mode === 'dark' ? 'rgba(41, 98, 255, 0.1)' : 'rgba(41, 98, 255, 0.05)') : undefined
                      }}
                    >
                      Filtreler
                    </Button>
                  </Badge>
                </Tooltip>
                
                <Tooltip title="Yenile">
                  <IconButton onClick={handleRefresh} disabled={refreshing} size="small" sx={{ borderRadius: 2 }}>
                    {refreshing ? <SyncIcon fontSize="small" className="rotating" /> : <RefreshIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
        </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Filtreler Paneli */}
        <Fade in={showFilters}>
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
              display: showFilters ? 'block' : 'none',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Gelişmiş Filtreleme
          </Typography>
              <Box>
                <Button 
                  size="small" 
                  startIcon={<AutoAwesomeIcon />} 
                  onClick={clearAllFilters}
                  sx={{ mr: 1, borderRadius: 2 }}
                >
                  Filtreleri Temizle
                </Button>
                <IconButton size="small" onClick={toggleFilterPanel} sx={{ borderRadius: 2 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          
          <Grid container spacing={3}>
              {/* Yön Filtreleri */}
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Piyasa Yönü
                </Typography>
                <ToggleButtonGroup
                  value={directionFilter}
                  exclusive
                  onChange={(e, val) => val && setDirectionFilter(val)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="all" sx={{ borderRadius: '4px 0 0 4px' }}>
                    Tümü
                  </ToggleButton>
                  <ToggleButton value="potential-up" sx={{ fontWeight: 'medium' }}>
                    <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.success.main }} />
                    Potansiyel Yükseliş
                  </ToggleButton>
                  <ToggleButton value="oversold" sx={{ borderRadius: '0 4px 4px 0', fontWeight: 'medium' }}>
                    <TrendingDownIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.error.main }} />
                    Aşırı Satış
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              {/* RSI ve Değişim */}
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  RSI
                </Typography>
                <FormControl size="small" sx={{ width: '100%', mb: 2 }}>
                  <Select
                    value={rsiFilter}
                    onChange={(e) => setRsiFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">Tümü</MenuItem>
                    <MenuItem value="oversold">Aşırı Satış (≤ 30)</MenuItem>
                    <MenuItem value="neutral">Nötr (30-70)</MenuItem>
                    <MenuItem value="overbought">Aşırı Alış (≥ 70)</MenuItem>
                    <MenuItem value="50-60">50-60 Arası</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Değişim %
                </Typography>
                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    value={changeFilter}
                    onChange={(e) => setChangeFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">Tümü</MenuItem>
                    <MenuItem value="up">Yükselenler</MenuItem>
                    <MenuItem value="down">Düşenler</MenuItem>
                    <MenuItem value="high">Yüksek Değişim (≥ %2)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Hacim ve Fiyat */}
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Hacim Filtresi
                </Typography>
                <FormControl size="small" sx={{ width: '100%', mb: 2 }}>
                  <Select
                    value={volumeFilter}
                    onChange={(e) => setVolumeFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">Tümü</MenuItem>
                    <MenuItem value="above">Ortalamanın Üstünde (≥ 1x)</MenuItem>
                    <MenuItem value="high">Yüksek (≥ 1.5x)</MenuItem>
                    <MenuItem value="very-high">Çok Yüksek (≥ 2x)</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Fiyat Aralığı (₺)
                </Typography>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={priceRange}
                    onChange={(e, newValue) => setPriceRange(newValue)}
                    min={0}
                    max={1000}
                    step={10}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}₺`}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {priceRange[0]}₺
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {priceRange[1]}₺
                    </Typography>
                  </Box>
                </Box>
          </Grid>
          
              {/* Favoriler Filtresi */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={showOnlyFavorites} 
                        onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Sadece Favorileri Göster"
                  />
                  
                  <Typography variant="caption" color="text.secondary">
                    {lastUpdated && `Son güncelleme: ${lastUpdated.toLocaleString('tr-TR')}`}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>
        
        {/* Ana İçerik - Hisse Tablosu */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Hisse verileri yükleniyor...
              </Typography>
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: {xs: 0, sm: 2}, 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : undefined 
              }}
            >
              {error}
            </Alert>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredStocks.length} adet hisse gösteriliyor (toplam {stocks.length})
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {filterCount > 0 && (
                    <Chip 
                      label={`${filterCount} aktif filtre`}
                      size="small" 
                      color="primary"
                      onDelete={clearAllFilters}
                      sx={{ borderRadius: '12px' }}
                    />
                  )}
                  
                  {directionFilter !== 'all' && (
                    <Chip 
                      label={directionFilter === 'potential-up' ? 'Potansiyel Yükseliş' : 'Aşırı Satış'} 
                      size="small" 
                      onDelete={() => setDirectionFilter('all')} 
                      sx={{ borderRadius: '12px' }}
                      color={directionFilter === 'potential-up' ? 'success' : 'secondary'}
                    />
                  )}
                  
                  {rsiFilter !== 'all' && (
                    <Chip 
                      label={`RSI: ${rsiFilter === 'oversold' ? 'Aşırı Satış' : 
                              rsiFilter === 'neutral' ? 'Nötr' : 
                              rsiFilter === 'overbought' ? 'Aşırı Alış' : '50-60'}`} 
                      size="small" 
                      onDelete={() => setRsiFilter('all')} 
                      sx={{ borderRadius: '12px' }}
                    />
                  )}
                  
                  {volumeFilter !== 'all' && (
                    <Chip 
                      label={`Hacim: ${volumeFilter === 'above' ? 'Ort. Üstü' : 
                              volumeFilter === 'high' ? 'Yüksek' : 'Çok Yüksek'}`} 
                      size="small" 
                      onDelete={() => setVolumeFilter('all')} 
                      sx={{ borderRadius: '12px' }}
                    />
                  )}
                  
                  {changeFilter !== 'all' && (
                    <Chip 
                      label={`Değişim: ${changeFilter === 'up' ? 'Yükseliş' : 
                              changeFilter === 'down' ? 'Düşüş' : 'Yüksek Değişim'}`} 
                      size="small" 
                      onDelete={() => setChangeFilter('all')} 
                      sx={{ borderRadius: '12px' }}
                    />
                  )}
                  
                  {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                    <Chip 
                      label={`Fiyat: ${priceRange[0]}₺ - ${priceRange[1]}₺`} 
                      size="small" 
                      onDelete={() => setPriceRange([0, 1000])} 
                      sx={{ borderRadius: '12px' }}
                    />
                  )}
                  
                  {showOnlyFavorites && (
                    <Chip 
                      icon={<StarIcon fontSize="small" />}
                      label="Sadece Favoriler"
                      size="small" 
                      onDelete={() => setShowOnlyFavorites(false)} 
                      sx={{ borderRadius: '12px' }}
                      color="warning"
                    />
                  )}
                </Box>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <StockTable stocks={filteredStocks} onStockClick={handleStockClick} />
              </Box>
        </>
      )}
        </Box>
    </Container>
      
      {/* CSS - Dönen Simge Animasyonu */}
      <style jsx="true">{`
        .rotating {
          animation: rotate 1s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default AllStocksPage; 