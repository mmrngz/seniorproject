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
  Button
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import api from '../services/api';

const DashboardPage = ({ user }) => {
  const [value, setValue] = useState(0);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Gerçek uygulamada API'dan kullanıcının favori hisselerini ve tahminleri alacak
        // Burada örnek veriler kullanıyoruz
        
        // Normalde: const response = await api.get('/user/favorites');
        const mockFavorites = [
          { id: 1, symbol: 'THYAO', name: 'Türk Hava Yolları', last_price: 235.60, daily_change: 2.3, rsi: 55.2, relative_volume: 1.8 },
          { id: 2, symbol: 'ASELS', name: 'Aselsan', last_price: 44.78, daily_change: -0.8, rsi: 48.5, relative_volume: 1.2 },
          { id: 3, symbol: 'KRDMD', name: 'Kardemir', last_price: 12.42, daily_change: 1.1, rsi: 52.7, relative_volume: 1.6 },
        ];
        
        // Normalde: const predResponse = await api.get('/stocks/predictions');
        const mockPredictions = [
          { 
            id: 1, 
            symbol: 'THYAO', 
            current_price: 235.60, 
            lstm_predicted_price: 241.2,
            lstm_change_percent: 2.4,
            gru_predicted_price: 240.5,
            gru_change_percent: 2.1,
            best_model: 'lstm',
            prediction_date: new Date().toISOString()
          },
          { 
            id: 2, 
            symbol: 'KRDMD', 
            current_price: 12.42,
            lstm_predicted_price: 12.90,
            lstm_change_percent: 3.9,
            gru_predicted_price: 12.78,
            gru_change_percent: 2.9,
            best_model: 'lstm',
            prediction_date: new Date().toISOString()
          },
        ];
        
        setFavoriteStocks(mockFavorites);
        setPredictions(mockPredictions);
        setLoading(false);
      } catch (err) {
        setError('Dashboard verileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const renderPredictionHistory = () => {
    // Tahmin geçmişi - gerçek uygulamada API'dan alınacak
    return (
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
            <TableRow>
              <TableCell>THYAO</TableCell>
              <TableCell>1 Hafta Önce</TableCell>
              <TableCell>230.50 ₺</TableCell>
              <TableCell>235.60 ₺</TableCell>
              <TableCell>
                <Chip label="Başarılı" color="success" size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ASELS</TableCell>
              <TableCell>1 Hafta Önce</TableCell>
              <TableCell>46.20 ₺</TableCell>
              <TableCell>44.78 ₺</TableCell>
              <TableCell>
                <Chip label="Başarısız" color="error" size="small" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderModelComparison = () => {
    // Model karşılaştırması - gerçek uygulamada API'dan alınacak
    return (
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
            <TableRow>
              <TableCell>LSTM</TableCell>
              <TableCell>85.2%</TableCell>
              <TableCell>0.0043</TableCell>
              <TableCell>0.0021</TableCell>
              <TableCell>
                <Chip label="Yüksek" color="success" size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>GRU</TableCell>
              <TableCell>87.5%</TableCell>
              <TableCell>0.0038</TableCell>
              <TableCell>0.0019</TableCell>
              <TableCell>
                <Chip label="Yüksek" color="success" size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Attention</TableCell>
              <TableCell>83.1%</TableCell>
              <TableCell>0.0051</TableCell>
              <TableCell>0.0025</TableCell>
              <TableCell>
                <Chip label="Orta" color="primary" size="small" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Hoş geldiniz, {user?.name || 'Kullanıcı'}! Favori hisselerinizi ve tahminleri buradan takip edebilirsiniz.
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
                
                {favoriteStocks.length > 0 ? (
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
                        {favoriteStocks.map((stock) => (
                          <TableRow key={stock.id}>
                            <TableCell>{stock.symbol}</TableCell>
                            <TableCell>{Number(stock.last_price).toFixed(3)} ₺</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ color: stock.daily_change >= 0 ? 'success.main' : 'error.main' }}
                              >
                                %{Number(stock.daily_change).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined">Detay</Button>
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
                          <TableCell>Değişim</TableCell>
                          <TableCell>Model</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {predictions.map((pred) => (
                          <TableRow key={pred.id}>
                            <TableCell>{pred.symbol}</TableCell>
                            <TableCell>{Number(pred.lstm_predicted_price).toFixed(3)} ₺</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ color: pred.lstm_change_percent >= 0 ? 'success.main' : 'error.main' }}
                              >
                                %{Number(pred.lstm_change_percent).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={pred.best_model.toUpperCase()} 
                                size="small"
                                color="primary"
                              />
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
              <Tabs value={value} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab icon={<HistoryIcon />} iconPosition="start" label="Tahmin Geçmişi" />
                <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="Model Karşılaştırması" />
              </Tabs>
            </Box>
            <Box sx={{ p: 2 }}>
              {value === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Tahmin Geçmişi</Typography>
                  {renderPredictionHistory()}
                </Box>
              )}
              {value === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Model Karşılaştırması</Typography>
                  {renderModelComparison()}
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