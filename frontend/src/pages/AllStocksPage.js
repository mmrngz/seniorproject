import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, TextField, Box, CircularProgress, Alert, Pagination } from '@mui/material';
import StockCard from '../components/StockCard';
import api from '../services/api';

const AllStocksPage = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const stocksPerPage = 12;

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/stocks/filtered');
        setStocks(response.data);
        setFilteredStocks(response.data);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (err) {
        setError('Hisse verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stock.name && stock.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStocks(filtered);
    }
    setPage(1);
  }, [searchTerm, stocks]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  // Sayfalandırma
  const indexOfLastStock = page * stocksPerPage;
  const indexOfFirstStock = indexOfLastStock - stocksPerPage;
  const currentStocks = filteredStocks.slice(indexOfFirstStock, indexOfLastStock);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tüm BIST Hisseleri
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        BIST'teki hisselerin güncel kapanış değerleri ve temel bilgileri.
        {lastUpdated && ` Son güncelleme: ${lastUpdated.toLocaleString()}`}
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        label="Hisse Ara"
        placeholder="Hisse sembolü veya adı..."
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 4 }}
      />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toplam {filteredStocks.length} hisse bulundu
          </Typography>
          
          <Grid container spacing={3}>
            {currentStocks.map((stock) => (
              <Grid item key={stock.id} xs={12} sm={6} md={4}>
                <StockCard stock={stock} />
              </Grid>
            ))}
          </Grid>
          
          {filteredStocks.length > stocksPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={Math.ceil(filteredStocks.length / stocksPerPage)} 
                page={page}
                onChange={handlePageChange}
                size="large"
                color="primary"
              />
            </Box>
          )}
          
          {filteredStocks.length === 0 && (
            <Alert severity="info">Arama kriterlerine uygun hisse bulunamadı.</Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default AllStocksPage; 