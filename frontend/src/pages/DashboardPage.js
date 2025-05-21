import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

import dashboardService from '../services/dashboardService';
import apiService from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [tabValue, setValue] = useState(0);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [favoriteStocksData, setFavoriteStocksData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [modelComparison, setModelComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Dashboard verilerini yükle
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dashboard verilerini getir
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Favori hisseleri getir
      const favoritesData = await dashboardService.getFavorites();
      setFavoriteStocks(favoritesData);

      // Son tahminleri getir
      const predictionsData = await dashboardService.getLatestPredictions();
      setPredictions(predictionsData);

      // Tahmin geçmişini getir
      const historyData = await dashboardService.getPredictionHistory();
      setPredictionHistory(historyData);

      // Model karşılaştırmasını getir
      const comparisonData = await dashboardService.getModelComparison();
      setModelComparison(comparisonData.models || []);

      // Favori hisselerin güncel verilerini getir
      if (favoritesData.length > 0) {
        await fetchFavoriteStocksData(favoritesData);
      }

      setLoading(false);
    } catch (err) {
      setError('Dashboard verileri yüklenirken bir hata oluştu: ' + err.message);
      setLoading(false);
    }
  };

  // Favori hisse verilerini getir
  const fetchFavoriteStocksData = async (favorites) => {
    try {
      const stocksData = [];
      
      // Her bir favori hisse için detay bilgilerini getir
      for (const favorite of favorites) {
        try {
          const response = await apiService.getStockBySymbol(favorite.symbol);
          stocksData.push(response.data);
        } catch (error) {
          console.error(`${favorite.symbol} için veri alınamadı:`, error);
        }
      }
      
      setFavoriteStocksData(stocksData);
    } catch (error) {
      console.error('Favori hisse verileri alınırken hata:', error);
    }
  };

  // Yenile
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  };

  // Favori hisseye git
  const handleStockClick = (symbol) => {
    navigate(`/stocks/${symbol}`);
  };

  // Favorilerden çıkar
  const handleRemoveFavorite = async (symbol, event) => {
    event.stopPropagation();
    try {
      await dashboardService.removeFavorite(symbol);
      // Güncel favori listesini getir
      const favoritesData = await dashboardService.getFavorites();
      setFavoriteStocks(favoritesData);
      // Favori hisselerin güncel verilerini getir
      await fetchFavoriteStocksData(favoritesData);
    } catch (error) {
      console.error('Favori silinirken hata:', error);
    }
  };

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      // Tahmin Geçmişi sayfasına yönlendir
      navigate('/prediction-history');
    } else if (newValue === 1) {
      // Model Karşılaştırma sayfasına yönlendir
      navigate('/model-comparison');
    } else {
      setValue(newValue);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Yenileniyor...' : 'Yenile'}
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Hoş geldiniz! Favori hisselerinizi ve tahminleri buradan takip edebilirsiniz.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      ) : (
        <>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  <FavoriteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Favori Hisseleriniz
                </Typography>
                
                {favoriteStocksData.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sembol</TableCell>
                          <TableCell>Fiyat</TableCell>
                          <TableCell>Değişim</TableCell>
                          <TableCell>İşlem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {favoriteStocksData.map((stock) => (
                          <TableRow 
                            key={stock.symbol} 
                            hover
                            onClick={() => handleStockClick(stock.symbol)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <StarIcon sx={{ color: 'warning.main', mr: 1, fontSize: 16 }} />
                                {stock.symbol}
                              </Box>
                            </TableCell>
                            <TableCell>{Number(stock.last_price).toFixed(2)} ₺</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ color: stock.daily_change >= 0 ? 'success.main' : 'error.main' }}
                              >
                                %{Number(stock.daily_change).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Favorilerden çıkar">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={(e) => handleRemoveFavorite(stock.symbol, e)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                sx={{ ml: 1 }}
                                component={Link}
                                to={`/stocks/${stock.symbol}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Detay
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Henüz favorilere eklenen hisse yok.</Alert>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Son Tahminler
                </Typography>
                
                {predictions.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sembol</TableCell>
                          <TableCell>Tahmin Fiyat</TableCell>
                          <TableCell>Model</TableCell>
                          <TableCell>İşlem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {predictions.map((pred) => (
                          <TableRow 
                            key={pred.id}
                            hover
                            onClick={() => handleStockClick(pred.symbol)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{pred.symbol}</TableCell>
                            <TableCell>{Number(pred.prediction_price).toFixed(2)} ₺</TableCell>
                            <TableCell>
                              <Chip 
                                label={pred.model_used} 
                                size="small"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                variant="outlined"
                                component={Link}
                                to={`/stocks/${pred.symbol}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Detay
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Henüz tahmin yapılmamış.</Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ width: '100%', mt: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab icon={<HistoryIcon />} iconPosition="start" label="Tahmin Geçmişi" />
                <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="Model Karşılaştırması" />
              </Tabs>
            </Box>
            <Box sx={{ p: 2 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Tahmin Geçmişi</Typography>
                  {predictionHistory.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Hisse</TableCell>
                            <TableCell>Tahmin Tarihi</TableCell>
                            <TableCell>Tahmin Fiyat</TableCell>
                            <TableCell>Gerçekleşen</TableCell>
                            <TableCell>Doğruluk</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {predictionHistory.map((hist) => (
                            <TableRow key={hist.id} hover>
                              <TableCell>{hist.symbol}</TableCell>
                              <TableCell>
                                {new Date(hist.prediction_date).toLocaleDateString('tr-TR')}
                              </TableCell>
                              <TableCell>{Number(hist.prediction_price).toFixed(2)} ₺</TableCell>
                              <TableCell>
                                {hist.actual_price ? `${Number(hist.actual_price).toFixed(2)} ₺` : '-'}
                              </TableCell>
                              <TableCell>
                                {hist.is_successful !== null ? (
                                  <Chip 
                                    label={hist.is_successful ? "Başarılı" : "Başarısız"} 
                                    color={hist.is_successful ? "success" : "error"} 
                                    size="small" 
                                  />
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">Tahmin geçmişi bulunamadı.</Alert>
                  )}
                </Box>
              )}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Model Karşılaştırması</Typography>
                  {modelComparison.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Model</TableCell>
                            <TableCell>Ortalama Doğruluk</TableCell>
                            <TableCell>MSE</TableCell>
                            <TableCell>MAE</TableCell>
                            <TableCell>Başarı Oranı</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {modelComparison.map((model, index) => (
                            <TableRow key={index}>
                              <TableCell>{model.model_name}</TableCell>
                              <TableCell>{model.accuracy.toFixed(1)}%</TableCell>
                              <TableCell>{model.mse.toFixed(4)}</TableCell>
                              <TableCell>{model.mae.toFixed(4)}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={
                                    model.success_rate >= 0.8 ? "Yüksek" :
                                    model.success_rate >= 0.6 ? "Orta" : "Düşük"
                                  } 
                                  color={
                                    model.success_rate >= 0.8 ? "success" :
                                    model.success_rate >= 0.6 ? "primary" : "error"
                                  } 
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">Model karşılaştırma verisi bulunamadı.</Alert>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}
    </Container>
  );
};

export default DashboardPage; 