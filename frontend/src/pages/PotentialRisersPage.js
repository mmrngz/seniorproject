import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress, 
  Button,
  Alert,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';

import StockCard from '../components/StockCard';
import apiService from '../services/api';

const PotentialRisersPage = () => {
  const theme = useTheme();
  
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Potansiyel yükselicileri çek
  const fetchPotentialRisers = async (refresh = false) => {
    try {
      setIsRefreshing(refresh);
      if (!refresh) setLoading(true);
      setError('');
      
      const response = await apiService.getFilteredPredictions(refresh);
      setStocks(response.data || []);
      
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      setError('Veriler yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
      console.error('Hata:', err);
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchPotentialRisers();
  }, []);
  
  // Yenile butonu
  const handleRefresh = () => {
    fetchPotentialRisers(true);
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
      <Container maxWidth={false} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: {xs: 0.5, sm: 1}, overflow: 'hidden' }}>
        {/* Başlık */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 1, 
            p: {xs: 1.5, sm: 2},
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
              <ShowChartIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Potansiyel Yükseliciler
              </Typography>
            </Box>
            
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="small"
            >
              {isRefreshing ? 'Yenileniyor...' : 'Yenile'}
            </Button>
          </Box>
        </Paper>

        {/* İçerik */}
        <Paper 
          elevation={0} 
          sx={{ 
            flexGrow: 1,
            borderRadius: {xs: 0, sm: 2},
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.8)' : 'white',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, flexGrow: 1 }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Potansiyel yükseliciler yükleniyor...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : stocks.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, flexGrow: 1 }}>
              <Typography variant="body1" color="text.secondary">
                Potansiyel yükseliş gösteren hisse bulunamadı.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {stocks.length} hisse listeleniyor
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {stocks.map((stock) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={stock.symbol}>
                    <StockCard stock={{
                      ...stock,
                      predictions: {
                        lstm_predicted_price: stock.lstm_predicted_price,
                        lstm_change_percent: stock.lstm_change_percent,
                        gru_predicted_price: stock.gru_predicted_price,
                        gru_change_percent: stock.gru_change_percent,
                        best_model: stock.best_model
                      }
                    }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default PotentialRisersPage; 