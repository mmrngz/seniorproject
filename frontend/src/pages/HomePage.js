import React from 'react';
import { Container, Typography, Box, Button, Grid, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';

const HomePage = () => {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        pt: 8,
        pb: 6,
      }}
    >
      <Container maxWidth="md">
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          BIST Hisse Tahmin Sistemi
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Güncel BIST verilerini takip edin, güçlü yapay zeka modellerimizle gelecek 
          tahminlerini analiz edin ve potansiyel yükseliş gösterecek hisseleri keşfedin.
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            to="/potential-risers"
            startIcon={<TrendingUpIcon />}
            sx={{ mx: 1 }}
          >
            Potansiyel Yükseliş Gösteren Hisseler
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            component={Link} 
            to="/all-stocks"
            startIcon={<ShowChartIcon />}
            sx={{ mx: 1 }}
          >
            Tüm BIST Hisseleri
          </Button>
        </Box>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 240,
                textAlign: 'center',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShowChartIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                BIST Verileri
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Günlük kapanış değerleri ve teknik göstergeler
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 240,
                textAlign: 'center',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Yapay Zeka Tahminleri
              </Typography>
              <Typography variant="body1" color="text.secondary">
                LSTM, GRU ve Attention model tahminleri
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 240,
                textAlign: 'center',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChartIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Teknik Analiz
              </Typography>
              <Typography variant="body1" color="text.secondary">
                RSI, Pivot ve Hacim temelli filtrelemeler
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage; 