import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  TableSortLabel,
  Tooltip,
  useTheme,
  Grid,
  LinearProgress,
  Fade,
  Chip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Hisse sembollerinden avatar rengi oluşturma fonksiyonu
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

// Logo URL'sini oluşturan fonksiyon
const getLogoUrl = (symbol) => {
  if (!symbol) return '';
  const upperSymbol = symbol.toUpperCase();
  return `https://cdn.jsdelivr.net/gh/ahmeterenodaci/Istanbul-Stock-Exchange--BIST--including-symbols-and-logos/logos/${upperSymbol}.png`;
};

// RSI ilerleme çubuğu renkleri
const getRsiProgressColor = (rsi) => {
  if (rsi <= 30) return '#26A69A'; // Yeşil - aşırı satış
  if (rsi >= 70) return '#EF5350'; // Kırmızı - aşırı alış
  if (rsi >= 50) return '#FF9800'; // Turuncu - nötr üstü
  return '#2196F3'; // Mavi - nötr altı
};

// Ana StockTable bileşeni
const StockTable = ({ stocks, onStockClick }) => {
  const theme = useTheme();
  const [orderBy, setOrderBy] = useState('symbol');
  const [order, setOrder] = useState('asc'); // 'asc' veya 'desc'
  const [favorite, setFavorite] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);

  // Sıralama fonksiyonu
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Favori durumunu değiştir
  const toggleFavorite = (symbol) => {
    setFavorite(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };

  // Tabloyu sırala
  const sortedStocks = React.useMemo(() => {
    if (!stocks || !stocks.length) return [];

    return [...stocks].sort((a, b) => {
      // Önce favorileri en üstte göster
      if (favorite[a.symbol] && !favorite[b.symbol]) return -1;
      if (!favorite[a.symbol] && favorite[b.symbol]) return 1;

      // Sonra seçilen sütuna göre sırala
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Özel durumlar için
      if (orderBy === 'symbol') {
        aValue = a.symbol || '';
        bValue = b.symbol || '';
      } else if (orderBy === 'price') {
        aValue = a.current_price || a.last_price || 0;
        bValue = b.current_price || b.last_price || 0;
      } else if (orderBy === 'change') {
        aValue = a.daily_change || a.lstm_change_percent || 0;
        bValue = b.daily_change || b.lstm_change_percent || 0;
      } else if (orderBy === 'volume') {
        aValue = a.daily_volume || a.volume || 0;
        bValue = b.daily_volume || b.volume || 0;
      } else if (orderBy === 'relVolume') {
        aValue = a.relative_volume || 0;
        bValue = b.relative_volume || 0;
      } else if (orderBy === 'rsi') {
        aValue = a.rsi || 0;
        bValue = b.rsi || 0;
      }

      // Sayısal değerler için
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String değerler için
      return order === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [stocks, order, orderBy, favorite]);

  // Değişim yüzdesini formatlama ve renklendirme
  const formatChangePercent = (change) => {
    if (change === undefined || change === null) return null;
    
    const isPositive = change >= 0;
    const color = isPositive ? theme.palette.success.main : theme.palette.error.main;
    const icon = isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color }}>
        {icon}
        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontWeight: 'medium' }}>
          %{Math.abs(change).toFixed(2)}
        </Typography>
      </Box>
    );
  };

  // Hacim formatı
  const formatVolume = (volume) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  // Tablo başlığı sütunları
  const columns = [
    { id: 'symbol', label: 'Sembol', width: '25%', align: 'left' },
    { id: 'price', label: 'Fiyat', width: '15%', align: 'right' },
    { id: 'change', label: 'Değişim %', width: '15%', align: 'right' },
    { id: 'volume', label: 'Hacim', width: '15%', align: 'right' },
    { id: 'relVolume', label: 'Bağıl Hacim', width: '15%', align: 'right' },
    { id: 'rsi', label: 'RSI', width: '15%', align: 'right' }
  ];

  return (
    <Paper sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25,25,35,0.9)' : '#FFFFFF',
      borderRadius: {xs: 0, sm: 2},
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 8px 32px rgba(0,0,0,0.3)' 
        : '0 8px 32px rgba(0,0,0,0.1)',
      border: theme.palette.mode === 'dark' 
        ? '1px solid rgba(255,255,255,0.08)' 
        : '1px solid rgba(0,0,0,0.03)'
    }}>
      <TableContainer sx={{ 
        flexGrow: 1, 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Table stickyHeader size="small" sx={{ height: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 50 }}></TableCell>
              {columns.map((column) => (
                <TableCell 
                  key={column.id}
                  align={column.align}
                  sx={{ 
                    width: column.width,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15,15,25,0.9)' : '#F5F5F5',
                    fontWeight: 'bold',
                    px: 2,
                    py: 1.5
                  }}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ overflow: 'auto' }}>
            {sortedStocks.map((stock) => {
              return (
                <TableRow 
                  hover
                  key={stock.symbol} 
                  onClick={() => onStockClick && onStockClick(stock)}
                  onMouseEnter={() => setHoveredRow(stock.symbol)}
                  onMouseLeave={() => setHoveredRow(null)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(30,30,45,0.9)' 
                        : 'rgba(240,247,255,0.9)'
                    },
                    borderLeft: favorite[stock.symbol] 
                      ? `3px solid ${theme.palette.warning.main}`
                      : '3px solid transparent',
                    transition: 'all 0.2s ease-in-out',
                    height: '60px'
                  }}
                >
                  <TableCell padding="checkbox" sx={{ pl: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(stock.symbol);
                      }}
                      sx={{ 
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.2)' }
                      }}
                    >
                      {favorite[stock.symbol] ? 
                        <StarIcon fontSize="small" sx={{ color: theme.palette.warning.main }} /> : 
                        <StarBorderIcon fontSize="small" />
                      }
                    </IconButton>
                  </TableCell>
                  
                  <TableCell sx={{ pl: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={getLogoUrl(stock.symbol)}
                        alt={stock.symbol}
                        variant="rounded"
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          marginRight: 2,
                          bgcolor: getSymbolColor(stock.symbol),
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {stock.symbol?.substring(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.2 }}>
                          {stock.symbol}
                        </Typography>
                        {stock.name && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {stock.name.length > 25 ? `${stock.name.substring(0, 25)}...` : stock.name}
                          </Typography>
                        )}
                      </Box>
                      {hoveredRow === stock.symbol && (
                        <Fade in={hoveredRow === stock.symbol}>
                          <IconButton 
                            size="small" 
                            sx={{ ml: 'auto', opacity: 0.8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Burada detay görüntüleme işlevi eklenebilir
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Fade>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {Number(stock.current_price || stock.last_price).toFixed(2)} ₺
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    {formatChangePercent(stock.daily_change || 0)}
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {formatVolume(stock.daily_volume || stock.volume || 0)}
                      </Typography>
                      {(stock.daily_volume > 500000 || stock.volume > 500000) && (
                        <Chip 
                          size="small" 
                          label="Yüksek" 
                          sx={{ 
                            height: 18, 
                            fontSize: '0.65rem', 
                            backgroundColor: 'rgba(38, 166, 154, 0.1)',
                            color: theme.palette.success.main
                          }} 
                        />
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'medium',
                          color: (stock.relative_volume || 0) > 1.4 ? theme.palette.success.main : theme.palette.text.primary 
                        }}
                      >
                        {(stock.relative_volume || 0).toFixed(2)}x
                      </Typography>
                      {(stock.relative_volume || 0) > 1.4 && (
                        <ArrowUpwardIcon 
                          fontSize="small" 
                          sx={{ 
                            ml: 0.5, 
                            color: theme.palette.success.main,
                            fontSize: '1rem'
                          }} 
                        />
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'medium' }}>
                        {(stock.rsi || 0).toFixed(1)}
                      </Typography>
                      <Box sx={{ width: '80%', mr: 0 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(stock.rsi || 0, 100)}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getRsiProgressColor(stock.rsi || 0),
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default StockTable;