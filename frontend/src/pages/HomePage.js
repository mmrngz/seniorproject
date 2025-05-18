import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper, 
  useTheme, 
  useMediaQuery,
  Card,
  CardContent,
  Avatar,
  Divider,
  Fade,
  Grow
} from '@mui/material';
import { Link } from 'react-router-dom';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import TimelineIcon from '@mui/icons-material/Timeline';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(18,18,28,0.95) 0%, rgba(25,35,55,0.95) 100%)'
          : 'linear-gradient(135deg, #f8f9fc 0%, #eef2f8 100%)',
        pt: { xs: 6, md: 10 },
        pb: { xs: 8, md: 12 },
        overflow: 'hidden',
        position: 'relative',
        minHeight: '100vh',
      }}
    >
      {/* Dekoratif arka plan elementleri */}
      <Box 
        sx={{ 
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(33,150,243,0.05) 0%, rgba(255,255,255,0) 70%)',
          top: '-200px',
          right: '-100px',
          zIndex: 0
        }} 
      />
      
      <Box 
        sx={{ 
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle, rgba(76,175,80,0.08) 0%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(76,175,80,0.05) 0%, rgba(255,255,255,0) 70%)',
          bottom: '-200px',
          left: '-100px',
          zIndex: 0
        }} 
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={1000}>
          <Box>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mb: 6
              }}
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)',
                  width: { xs: 80, md: 100 },
                  height: { xs: 80, md: 100 },
                  mb: 3,
                  boxShadow: '0 0 30px rgba(33,150,243,0.3)'
                }}
              >
                <AutoGraphIcon 
                  sx={{ 
                    fontSize: { xs: 40, md: 50 }, 
                    color: theme.palette.primary.main,
                  }} 
                />
              </Avatar>
              
              <Typography
                component="h1"
                variant={isMobile ? "h3" : "h2"}
                align="center"
                fontWeight="bold"
                sx={{ 
                  mb: 2,
                  backgroundImage: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #90caf9, #42a5f5)'
                    : 'linear-gradient(90deg, #1976d2, #2196f3)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  textShadow: theme.palette.mode === 'dark' ? '0 0 30px rgba(33,150,243,0.3)' : 'none',
                }}
              >
                BIST Hisse Tahmin Sistemi
              </Typography>
              
              <Typography 
                variant="h6" 
                align="center" 
                color="text.secondary" 
                paragraph
                sx={{ 
                  maxWidth: '800px',
                  mx: 'auto',
                  px: 2,
                  lineHeight: 1.6,
                  fontWeight: 400
                }}
              >
                Güncel BIST verilerini takip edin, güçlü yapay zeka modellerimizle gelecek 
                tahminlerini analiz edin ve potansiyel yükseliş gösterecek hisseleri keşfedin.
              </Typography>
              
              <Divider 
                sx={{ 
                  width: '120px', 
                  my: 3, 
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderWidth: 2,
                  borderRadius: 1
                }} 
              />
              
              <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  component={Link} 
                  to="/potential-risers"
                  startIcon={<TrendingUpIcon />}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(33,150,243,0.3)' : '0 4px 12px rgba(25,118,210,0.2)',
                    fontSize: '1rem'
                  }}
                >
                  Potansiyel Yükselişçiler
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  component={Link} 
                  to="/all-stocks"
                  startIcon={<ShowChartIcon />}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    borderWidth: 2,
                    fontSize: '1rem'
                  }}
                >
                  Tüm BIST Hisseleri
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {[
            {
              icon: <ShowChartIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
              title: "BIST Verileri",
              description: "Günlük kapanış değerleri ve teknik göstergeler ile hisseleri analiz edin.",
              color: "primary",
              delay: 100
            },
            {
              icon: <TimelineIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
              title: "Yapay Zeka Tahminleri",
              description: "LSTM, GRU ve Attention modelleri ile geliştirilen tahmin algoritmaları.",
              color: "success",
              delay: 300
            },
            {
              icon: <AnalyticsIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
              title: "Teknik Analiz",
              description: "RSI, Pivot ve Hacim temelli filtrelemeler ile potansiyel hisseleri keşfedin.",
              color: "info",
              delay: 500
            }
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={1000 + item.delay}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(35,35,50,0.5)' : 'white',
                    boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.palette.mode === 'dark' ? '0 12px 28px rgba(0,0,0,0.3)' : '0 8px 28px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      width: '150px', 
                      height: '150px', 
                      borderRadius: '50%',
                      background: theme.palette.mode === 'dark' 
                        ? `radial-gradient(circle, ${theme.palette[item.color].dark}20 0%, rgba(0,0,0,0) 70%)`
                        : `radial-gradient(circle, ${theme.palette[item.color].light}20 0%, rgba(255,255,255,0) 70%)`,
                      top: '-75px',
                      right: '-75px',
                    }} 
                  />
                  
                  <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.mode === 'dark' ? `${theme.palette[item.color].dark}20` : `${theme.palette[item.color].light}20`,
                        width: 80,
                        height: 80,
                        mb: 3,
                        boxShadow: `0 0 20px ${theme.palette[item.color].main}40`
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    
                    <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                      {item.title}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            BIST Tahmin Sistemi © {new Date().getFullYear()} - Yapay zeka destekli hisse senedi analiz platformu
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage; 