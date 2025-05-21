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
  Grid,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CompareIcon from '@mui/icons-material/Compare';
import dashboardService from '../services/dashboardService';

const ModelComparisonPage = () => {
  const [modelComparison, setModelComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Veri yükleme
  useEffect(() => {
    fetchModelComparison();
  }, []);

  // Model karşılaştırma verilerini getir
  const fetchModelComparison = async () => {
    try {
      setLoading(true);
      setError('');

      // Model karşılaştırma verilerini al
      const comparisonData = await dashboardService.getModelComparison();
      setModelComparison(comparisonData.models || []);

      setLoading(false);
    } catch (err) {
      setError('Model karşılaştırma verileri yüklenirken bir hata oluştu: ' + err.message);
      setLoading(false);
    }
  };

  // Yenile
  const handleRefresh = () => {
    setRefreshing(true);
    fetchModelComparison().finally(() => setRefreshing(false));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <CompareIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Model Karşılaştırması
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
        Farklı tahmin modellerinin performans karşılaştırması.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {modelComparison.map((model, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    height: '100%',
                    borderLeft: '4px solid',
                    borderColor: index === 0 ? 'primary.main' : 
                                 index === 1 ? 'secondary.main' : 
                                 index === 2 ? 'success.main' : 
                                 index === 3 ? 'warning.main' : 'info.main'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {model.model_name}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Doğruluk
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={model.accuracy} 
                            color={model.accuracy >= 90 ? "success" : model.accuracy >= 80 ? "primary" : "warning"}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            %{model.accuracy.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Precision
                        </Typography>
                        <Typography variant="body2">{model.precision.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Recall
                        </Typography>
                        <Typography variant="body2">{model.recall.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          F1 Score
                        </Typography>
                        <Typography variant="body2">{model.f1_score.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Eğitim Süresi
                        </Typography>
                        <Typography variant="body2">{model.training_time} sn</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Detaylı Karşılaştırma</Typography>
            
            {modelComparison.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Doğruluk (%)</TableCell>
                      <TableCell>Precision</TableCell>
                      <TableCell>Recall</TableCell>
                      <TableCell>F1 Score</TableCell>
                      <TableCell>Eğitim Süresi (sn)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modelComparison.map((model, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Chip 
                            label={model.model_name} 
                            color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"} 
                            variant={index < 2 ? "filled" : "outlined"}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{model.accuracy.toFixed(1)}%</TableCell>
                        <TableCell>{model.precision.toFixed(3)}</TableCell>
                        <TableCell>{model.recall.toFixed(3)}</TableCell>
                        <TableCell>{model.f1_score.toFixed(3)}</TableCell>
                        <TableCell>{model.training_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Model karşılaştırma verisi bulunamadı.</Alert>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default ModelComparisonPage; 