import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StockCard = ({ stock }) => {
  // Değişim yüzdesine göre renk belirle
  const getChangeColor = (change) => {
    if (!change && change !== 0) return 'grey';
    return change >= 0 ? 'success.main' : 'error.main';
  };

  // İkon seç
  const getChangeIcon = (change) => {
    if (!change && change !== 0) return null;
    return change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  // Logo URL'sini oluştur
  const getLogoUrl = (symbol) => {
    return `https://financialmodelingprep.com/image-stock/${symbol}.png`;
  };

  return (
    <Card sx={{ display: 'flex', mb: 2, height: '100%' }}>
      <CardMedia
        component="img"
        sx={{ width: 100, objectFit: 'contain', p: 2 }}
        image={getLogoUrl(stock.symbol)}
        alt={stock.symbol}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/100x100?text=' + stock.symbol;
        }}
      />
      <CardContent sx={{ flex: '1 0 auto', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography component="div" variant="h5">
              {stock.symbol}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {stock.name || "BIST Hissesi"}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="h6">{stock.current_price || stock.last_price} ₺</Typography>
            {(stock.daily_change !== undefined || stock.lstm_change_percent !== undefined) && (
              <Typography
                variant="body2"
                sx={{
                  color: getChangeColor(stock.daily_change || stock.lstm_change_percent),
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {getChangeIcon(stock.daily_change || stock.lstm_change_percent)}
                %{Math.abs((stock.daily_change || stock.lstm_change_percent || 0)).toFixed(2)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Tahmin bilgileri varsa göster */}
        {(stock.lstm_predicted_price || stock.gru_predicted_price) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Tahminler:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {stock.lstm_predicted_price && (
                <Chip
                  label={`LSTM: ${stock.lstm_predicted_price.toFixed(2)} ₺ (%${stock.lstm_change_percent.toFixed(2)})`}
                  color={stock.lstm_change_percent >= 0 ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
              )}
              {stock.gru_predicted_price && (
                <Chip
                  label={`GRU: ${stock.gru_predicted_price.toFixed(2)} ₺ (%${stock.gru_change_percent.toFixed(2)})`}
                  color={stock.gru_change_percent >= 0 ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
              )}
              {stock.attention_predicted_price && (
                <Chip
                  label={`ATT: ${stock.attention_predicted_price.toFixed(2)} ₺ (%${stock.attention_change_percent.toFixed(2)})`}
                  color={stock.attention_change_percent >= 0 ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
              )}
              {stock.best_model && (
                <Chip
                  label={`En iyi: ${stock.best_model.toUpperCase()}`}
                  color="primary"
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Teknik göstergeler varsa göster */}
        {stock.rsi && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Teknik Göstergeler:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`RSI: ${stock.rsi.toFixed(2)}`}
                color={stock.rsi < 30 ? "success" : stock.rsi > 70 ? "error" : "default"}
                size="small"
                variant="outlined"
              />
              {stock.relative_volume && (
                <Chip
                  label={`Hacim: ${stock.relative_volume.toFixed(2)}x`}
                  color={stock.relative_volume > 1.5 ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StockCard; 