import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  CircularProgress, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  Button,
  Chip,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import StockCard from '../components/StockCard';
import api from '../services/api';

const PotentialRisersPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtre ayarları
  const [modelType, setModelType] = useState('all');
  const [minChangePercent, setMinChangePercent] = useState(0.5);
  const [includeTechnical, setIncludeTechnical] = useState(true);

  useEffect(() => {
    fetchPotentialRisers();
  }, []);

  const fetchPotentialRisers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stocks/potential-risers', {
        params: {
          model_type: modelType,
          min_change_percent: minChangePercent,
          include_technical: includeTechnical
        }
      });
      setStocks(response.data);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError('Potansiyel hisseler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPotentialRisers();
  };

  const handleFilterChange = () => {
    fetchPotentialRisers();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Potansiyel Yükseliş Gösteren Hisseler
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
        RSI, hacim ve pivot kriterlerine göre potansiyel yükseliş gösterecek BIST hisseleri.
        {lastUpdated && ` Son güncelleme: ${lastUpdated.toLocaleString()}`}
      </Typography>
      
      <Box sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Filtreler
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tahmin Modeli</InputLabel>
              <Select
                value={modelType}
                label="Tahmin Modeli"
                onChange={(e) => setModelType(e.target.value)}
              >
                <MenuItem value="all">Tüm Modeller</MenuItem>
                <MenuItem value="lstm">LSTM</MenuItem>
                <MenuItem value="gru">GRU</MenuItem>
                <MenuItem value="attention">Attention</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography id="min-change-slider" gutterBottom>
              Minimum Yükseliş Yüzdesi: %{minChangePercent.toFixed(1)}
            </Typography>
            <Slider
              value={minChangePercent}
              onChange={(e, newValue) => setMinChangePercent(newValue)}
              aria-labelledby="min-change-slider"
              step={0.1}
              min={0.1}
              max={5}
              marks={[
                { value: 0.1, label: '0.1%' },
                { value: 1, label: '1%' },
                { value: 2.5, label: '2.5%' },
                { value: 5, label: '5%' },
              ]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={handleFilterChange}
                sx={{ mt: 1 }}
              >
                Filtreleri Uygula
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Aktif Filtreler:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="RSI: 50-60" color="primary" variant="outlined" />
          <Chip label="Bağıl Hacim ≥ 1.5" color="primary" variant="outlined" />
          <Chip label="Pivot Geçişi" color="primary" variant="outlined" />
          <Chip 
            label={`Minimum Yükseliş: %${minChangePercent.toFixed(1)}`} 
            color="primary" 
          />
          <Chip 
            label={`Model: ${modelType === 'all' ? 'Tümü' : modelType.toUpperCase()}`} 
            color="primary" 
          />
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      ) : (
        <>
          {stocks.length > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {stocks.length} adet potansiyel hisse bulundu
              </Typography>
              
              <Grid container spacing={3}>
                {stocks.map((stock) => (
                  <Grid item key={stock.id} xs={12} sm={6} md={4}>
                    <StockCard stock={stock} />
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Alert severity="info">
              Belirlenen kriterlere uygun potansiyel yükseliş gösteren hisse bulunamadı.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default PotentialRisersPage; 