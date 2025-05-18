import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Alert, 
  Button,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  FormControlLabel,
  Switch
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import SyncIcon from '@mui/icons-material/Sync';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScreeningCriteria from '../components/ScreeningCriteria';
import StockTable from '../components/StockTable';
import apiService from '../services/api';

const StockScreeningPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [predictionFilter, setPredictionFilter] = useState('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  useEffect(() => {
    fetchFilteredSymbols();
    
    // Kısayol tuşları için event listener
    const handleKeyDown = (e) => {
      // Ctrl + K tuşu ile arama alanına odaklanma
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    if (stocks.length > 0) {
      applyFilters();
    }
  }, [stocks, searchTerm, activeFilters, predictionFilter, showOnlyFavorites]);
  
  const fetchFilteredSymbols = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await apiService.getFilteredSymbols();
      
      if (response && response.data) {
        setStocks(response.data);
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
    fetchFilteredSymbols();
  };
  
  const toggleFilterPanel = () => {
    setShowFilters(!showFilters);
  };
  
  const addFilter = (filter) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };
  
  const removeFilter = (filter) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };
  
  const clearAllFilters = () => {
    setActiveFilters([]);
    setPredictionFilter('all');
    setSearchTerm('');
    setShowOnlyFavorites(false);
  };
  
  const applyFilters = () => {
    let filtered = [...stocks];
    
    // Arama filtresi
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(search) || 
        (stock.name && stock.name.toLowerCase().includes(search))
      );
    }
    
    // Tahmin yönü filtresi
    if (predictionFilter !== 'all') {
      if (predictionFilter === 'up') {
        filtered = filtered.filter(stock => 
          stock.prediction && 
          stock.prediction.direction === 'up'
        );
      } else if (predictionFilter === 'down') {
        filtered = filtered.filter(stock => 
          stock.prediction && 
          stock.prediction.direction === 'down'
        );
      } else if (predictionFilter === 'neutral') {
        filtered = filtered.filter(stock => 
          stock.prediction && 
          stock.prediction.direction === 'neutral'
        );
      }
    }
    
    // Özel filtreler
    if (activeFilters.includes('high-volume')) {
      filtered = filtered.filter(stock => stock.relative_volume >= 1.5);
    }
    
    if (activeFilters.includes('oversold')) {
      filtered = filtered.filter(stock => stock.rsi <= 30);
    }
    
    if (activeFilters.includes('bullish-pattern')) {
      filtered = filtered.filter(stock => 
        stock.rsi >= 40 && 
        stock.rsi <= 60 && 
        stock.daily_change >= 0 && 
        stock.relative_volume >= 1.2
      );
    }
    
    // Sadece favorileri göster
    if (showOnlyFavorites) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
      filtered = filtered.filter(stock => favorites[stock.symbol]);
    }
    
    setFilteredStocks(filtered);
  };
  
  const hasActiveFilters = () => {
    return activeFilters.length > 0 || predictionFilter !== 'all' || searchTerm || showOnlyFavorites;
  };
  
  const handleStockClick = (stock) => {
    console.log("Hisse detayı:", stock);
    // Detay sayfasına yönlendirme yapılabilir
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
      <Container maxWidth={false} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: {xs: 1, sm: 2}, overflow: 'hidden' }}>
        {/* Başlık ve Arama Bölümü */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 1, 
            p: {xs: 1, sm: 2},
            borderRadius: {xs: 0, sm: 2},
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.8)' : 'white',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
              <TrendingUpIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
              <Typography variant="h5" fontWeight="bold">
                Hisse Tarama
              </Typography>
              <Tooltip title="Belirli kriterlere göre filtrelenmiş, potansiyel olarak ilginç davranışlar gösteren hisseler burada listelenir." sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                id="search-input"
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
                <Badge badgeContent={activeFilters.length + (predictionFilter !== 'all' ? 1 : 0) + (showOnlyFavorites ? 1 : 0)} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold' } }}>
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
          </Box>
          
          {/* Filtre Paneli */}
          <Fade in={showFilters}>
            <Box sx={{ display: showFilters ? 'block' : 'none' }}>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Filtreler
                </Typography>
                <Button 
                  size="small" 
                  onClick={clearAllFilters} 
                  disabled={!hasActiveFilters()}
                  sx={{ borderRadius: 2 }}
                >
                  Tümünü Temizle
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Tahmin Yönü
                  </Typography>
                  <ToggleButtonGroup
                    value={predictionFilter}
                    exclusive
                    onChange={(e, val) => val && setPredictionFilter(val)}
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value="all">
                      Tümü
                    </ToggleButton>
                    <ToggleButton value="up">
                      <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.success.main }} />
                      Yükseliş
                    </ToggleButton>
                    <ToggleButton value="neutral">
                      <TrendingFlatIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.warning.main }} />
                      Nötr
                    </ToggleButton>
                    <ToggleButton value="down">
                      <TrendingDownIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.error.main }} />
                      Düşüş
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Hazır Filtreler
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label="Yüksek Hacim" 
                      onClick={() => addFilter('high-volume')} 
                      onDelete={activeFilters.includes('high-volume') ? () => removeFilter('high-volume') : undefined}
                      color={activeFilters.includes('high-volume') ? 'primary' : 'default'}
                      sx={{ borderRadius: '12px' }}
                    />
                    <Chip 
                      label="Aşırı Satış" 
                      onClick={() => addFilter('oversold')} 
                      onDelete={activeFilters.includes('oversold') ? () => removeFilter('oversold') : undefined}
                      color={activeFilters.includes('oversold') ? 'primary' : 'default'}
                      sx={{ borderRadius: '12px' }}
                    />
                    <Chip 
                      label="Yükseliş Sinyali" 
                      onClick={() => addFilter('bullish-pattern')} 
                      onDelete={activeFilters.includes('bullish-pattern') ? () => removeFilter('bullish-pattern') : undefined}
                      color={activeFilters.includes('bullish-pattern') ? 'primary' : 'default'}
                      sx={{ borderRadius: '12px' }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <WatchLaterIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                  Son güncelleme: {lastUpdated ? lastUpdated.toLocaleString('tr-TR') : 'Bilinmiyor'}
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Paper>
        
        {/* Aktif Filtrelerin Gösterimi */}
        {hasActiveFilters() && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {predictionFilter !== 'all' && (
              <Chip 
                label={`Tahmin: ${predictionFilter === 'up' ? 'Yükseliş' : predictionFilter === 'down' ? 'Düşüş' : 'Nötr'}`}
                onDelete={() => setPredictionFilter('all')}
                size="small"
                color={predictionFilter === 'up' ? 'success' : predictionFilter === 'down' ? 'error' : 'warning'}
                sx={{ borderRadius: '12px' }}
              />
            )}
            
            {activeFilters.includes('high-volume') && (
              <Chip 
                label="Yüksek Hacim"
                onDelete={() => removeFilter('high-volume')}
                size="small"
                sx={{ borderRadius: '12px' }}
              />
            )}
            
            {activeFilters.includes('oversold') && (
              <Chip 
                label="Aşırı Satış"
                onDelete={() => removeFilter('oversold')}
                size="small"
                sx={{ borderRadius: '12px' }}
              />
            )}
            
            {activeFilters.includes('bullish-pattern') && (
              <Chip 
                label="Yükseliş Sinyali"
                onDelete={() => removeFilter('bullish-pattern')}
                size="small"
                sx={{ borderRadius: '12px' }}
              />
            )}
            
            {showOnlyFavorites && (
              <Chip 
                label="Sadece Favoriler"
                onDelete={() => setShowOnlyFavorites(false)}
                size="small"
                color="warning"
                sx={{ borderRadius: '12px' }}
              />
            )}
            
            {searchTerm && (
              <Chip 
                label={`"${searchTerm}" araması`}
                onDelete={() => setSearchTerm('')}
                size="small"
                sx={{ borderRadius: '12px' }}
              />
            )}
          </Box>
        )}
        
        {/* Hisse Taraması Kriterleri */}
        <ScreeningCriteria />
        
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
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Filtre verileri yükleniyor...
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
              <Box sx={{ px: 1, py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredStocks.length} adet hisse gösteriliyor (toplam {stocks.length})
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <StockTable 
                  stocks={filteredStocks} 
                  onStockClick={handleStockClick} 
                  includeDirection={true} 
                />
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

export default StockScreeningPage; 