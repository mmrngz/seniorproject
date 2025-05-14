import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Divider, 
  Avatar, 
  CardActionArea,
  CardMedia,
  LinearProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { alpha, useTheme } from '@mui/material/styles';

const StockCard = ({ stock }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  // Logo URL'sini oluştur
  const getLogoUrl = (symbol) => {
    if (!symbol) return '';
    const upperSymbol = symbol.toUpperCase();
    return `https://cdn.jsdelivr.net/gh/ahmeterenodaci/Istanbul-Stock-Exchange--BIST--including-symbols-and-logos/logos/${upperSymbol}.png`;
  };

  // Logo yükleme hatası durumunda
  const handleLogoError = () => {
    setLogoError(true);
  };

  // Hisse detay sayfasına yönlendir
  const handleCardClick = () => {
    navigate(`/stocks/${stock.symbol}`);
  };

  // Değişim yüzdesine göre renk belirle
  const getChangeColor = (change) => {
    if (!change && change !== 0) return 'text.secondary';
    return change >= 0 ? 'success.main' : 'error.main';
  };

  // Değişim yüzdesine göre icon belirle
  const getChangeIcon = (change) => {
    if (!change && change !== 0) return null;
    return change >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
  };

  // Sembol için renkli arka plan oluştur
  const getSymbolColor = (symbol) => {
    if (!symbol) return '#f5f5f5';
    
    // Sembolü hash'e çevir
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Hash'ten renk oluştur
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };

  // Price formatting
  const formatPrice = (price) => {
    if (!price && price !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(price);
  };

  return (
    <Card 
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35,35,50,0.8)' : 'white',
        backdropFilter: 'blur(8px)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 10px 25px rgba(0,0,0,0.3)' 
            : '0 10px 25px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardActionArea onClick={handleCardClick}>
        <CardContent sx={{ p: 2, pb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            p: 2, 
            pb: 1, 
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            alignItems: 'center'
          }}>
            {/* Logo veya Avatar */}
            {!logoError ? (
              <CardMedia
                component="img"
                sx={{ 
                  width: 40, 
                  height: 40, 
                  objectFit: 'contain',
                  mr: 1.5,
                  p: 0.5,
                  backgroundColor: 'white',
                  borderRadius: '4px'
                }}
                image={getLogoUrl(stock.symbol)}
                alt={stock.symbol}
                onError={handleLogoError}
              />
            ) : (
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  mr: 1.5,
                  bgcolor: getSymbolColor(stock.symbol)
                }}
              >
                {stock.symbol.substring(0, 2)}
              </Avatar>
            )}
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {stock.symbol}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stock.name || 'BIST Hissesi'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              {formatPrice(stock.last_price || stock.current_price)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getChangeIcon(stock.daily_change)}
              <Typography 
                variant="body2" 
                color={getChangeColor(stock.daily_change)}
                sx={{ fontWeight: 'medium', ml: 0.5 }}
              >
                {stock.daily_change ? `${stock.daily_change >= 0 ? '+' : ''}${stock.daily_change.toFixed(2)}%` : '-'}
              </Typography>
            </Box>
          </Box>

          {stock.predictions && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Tahminler
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  LSTM:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'medium',
                    color: getChangeColor(stock.predictions.lstm_change_percent)
                  }}
                >
                  {formatPrice(stock.predictions.lstm_predicted_price)} ({stock.predictions.lstm_change_percent >= 0 ? '+' : ''}{stock.predictions.lstm_change_percent.toFixed(2)}%)
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  GRU:
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    fontWeight: 'medium',
                    color: getChangeColor(stock.predictions.gru_change_percent)
                  }}
                >
                  {formatPrice(stock.predictions.gru_predicted_price)} ({stock.predictions.gru_change_percent >= 0 ? '+' : ''}{stock.predictions.gru_change_percent.toFixed(2)}%)
                </Typography>
              </Box>
            </>
          )}

          {/* Teknik Göstergeler */}
          {(stock.rsi || stock.relative_volume) && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Teknik
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                {stock.rsi !== undefined && (
                  <Chip 
                    label={`RSI: ${stock.rsi.toFixed(0)}`} 
                    size="small"
                    color={stock.rsi > 70 ? "error" : stock.rsi < 30 ? "error" : stock.rsi > 50 ? "success" : "warning"}
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                )}
                
                {stock.relative_volume !== undefined && (
                  <Chip 
                    label={`Vol: ${stock.relative_volume.toFixed(1)}x`} 
                    size="small"
                    color={stock.relative_volume > 2 ? "primary" : "default"}
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                )}
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StockCard; 