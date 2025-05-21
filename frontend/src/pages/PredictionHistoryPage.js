import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import dashboardService from '../services/dashboardService';

const PredictionHistoryPage = () => {
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Veri yükleme
  useEffect(() => {
    fetchPredictionHistory();
  }, []);

  // Tahmin geçmişini getir
  const fetchPredictionHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Gerçek veritabanından tahmin geçmişini al
      const historyData = await dashboardService.getRealPredictionHistory(50); // 50 kayıt al
      setPredictionHistory(historyData);

      setLoading(false);
    } catch (err) {
      setError('Tahmin geçmişi yüklenirken bir hata oluştu: ' + err.message);
      setLoading(false);
    }
  };

  // Yenile
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPredictionHistory().finally(() => setRefreshing(false));
  };

  // Başarı durumunu belirle
  const getPredictionStatus = (accuracy) => {
    if (!accuracy) return { label: "Belirsiz", color: "default" };
    
    if (accuracy >= 90) return { label: "Başarılı", color: "success" };
    if (accuracy >= 75) return { label: "İyi", color: "success" };
    if (accuracy >= 50) return { label: "Orta", color: "warning" };
    return { label: "Başarısız", color: "error" };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <CompareArrowsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Tahmin Geçmişi
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
        Tüm hisseler için yapılan geçmiş tahminler ve gerçekleşen değerler.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      ) : (
        <Paper sx={{ p: 2 }}>
          {predictionHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hisse</TableCell>
                    <TableCell>Tahmin Tarihi</TableCell>
                    <TableCell>Tahmin Fiyat</TableCell>
                    <TableCell>Gerçekleşen</TableCell>
                    <TableCell>Doğruluk</TableCell>
                    <TableCell>Model</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictionHistory.map((hist) => {
                    const status = getPredictionStatus(hist.accuracy);
                    
                    return (
                      <TableRow key={hist.id} hover>
                        <TableCell>{hist.symbol}</TableCell>
                        <TableCell>{hist.prediction_date}</TableCell>
                        <TableCell>{typeof hist.predicted_price === 'number' ? Number(hist.predicted_price).toFixed(2) : 'NaN'} ₺</TableCell>
                        <TableCell>
                          {typeof hist.actual_price === 'number' ? `${Number(hist.actual_price).toFixed(2)} ₺` : 'NaN'}
                        </TableCell>
                        <TableCell>
                          {hist.accuracy ? (
                            <Chip 
                              label={`${Math.abs(Number(hist.accuracy)).toFixed(1)}%`}
                              color={status.color}
                              size="small"
                            />
                          ) : (
                            <Chip label="Belirsiz" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={hist.model} 
                            variant="filled" 
                            size="small" 
                            color="primary"
                            sx={{ 
                              minWidth: '80px',
                              fontWeight: 'bold',
                              color: 'white',
                              backgroundColor: 'primary.main', 
                              '& .MuiChip-label': { 
                                overflow: 'visible',
                                textOverflow: 'clip',
                                whiteSpace: 'normal',
                                padding: '4px 8px',
                                color: 'white'
                              } 
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">Tahmin geçmişi bulunamadı.</Alert>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default PredictionHistoryPage; 