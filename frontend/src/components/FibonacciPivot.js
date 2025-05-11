import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  TextField,
  Button,
  Paper,
  Divider
} from '@mui/material';

/**
 * Fibonacci Pivot Noktaları bileşeni
 * Kullanıcının fibonacci pivot noktalarını manuel olarak ayarlamasını sağlar
 */
const FibonacciPivot = ({ onApply }) => {
  // State değişkenleri
  const [period, setPeriod] = useState('1');
  const [pivotType, setPivotType] = useState('P');
  const [direction, setDirection] = useState('Aşağı Keser');
  const [priceType, setPriceType] = useState('Fiyat');
  
  // Ayarları uygula
  const handleApply = () => {
    if (onApply) {
      onApply({
        period,
        pivotType,
        direction,
        priceType
      });
    }
  };
  
  // Ayarları temizle
  const handleReset = () => {
    setPeriod('1');
    setPivotType('P');
    setDirection('Aşağı Keser');
    setPriceType('Fiyat');
  };
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        backgroundColor: '#212121', 
        color: 'white',
        borderRadius: 1
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          FIBONACCI PIVOT NOKTALARI
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 1 }}>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ 
                backgroundColor: '#333',
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#999',
                }
              }}
            >
              <MenuItem value="1">1 gün</MenuItem>
              <MenuItem value="3">3 gün</MenuItem>
              <MenuItem value="7">1 hafta</MenuItem>
              <MenuItem value="30">1 ay</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 1 }}>
            <Select
              value={pivotType}
              onChange={(e) => setPivotType(e.target.value)}
              sx={{ 
                backgroundColor: '#333',
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#999',
                }
              }}
            >
              <MenuItem value="P">P</MenuItem>
              <MenuItem value="R1">R1</MenuItem>
              <MenuItem value="R2">R2</MenuItem>
              <MenuItem value="R3">R3</MenuItem>
              <MenuItem value="S1">S1</MenuItem>
              <MenuItem value="S2">S2</MenuItem>
              <MenuItem value="S3">S3</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 1 }}>
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              sx={{ 
                backgroundColor: '#333',
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#999',
                }
              }}
            >
              <MenuItem value="Aşağı Keser">Aşağı Keser</MenuItem>
              <MenuItem value="Yukarı Keser">Yukarı Keser</MenuItem>
              <MenuItem value="Üstünde">Üstünde</MenuItem>
              <MenuItem value="Altında">Altında</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth variant="outlined" size="small">
            <Select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              sx={{ 
                backgroundColor: '#333',
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#999',
                }
              }}
            >
              <MenuItem value="Fiyat">Fiyat</MenuItem>
              <MenuItem value="Açılış">Açılış</MenuItem>
              <MenuItem value="Kapanış">Kapanış</MenuItem>
              <MenuItem value="Yüksek">Yüksek</MenuItem>
              <MenuItem value="Düşük">Düşük</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleReset}
            sx={{ 
              mr: 1, 
              color: 'white',
              borderColor: '#555',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }} 
            variant="outlined"
            size="small"
          >
            İptal
          </Button>
          <Button 
            onClick={handleApply}
            sx={{ 
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#115293'
              }
            }} 
            variant="contained"
            size="small"
          >
            Uygula
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FibonacciPivot; 