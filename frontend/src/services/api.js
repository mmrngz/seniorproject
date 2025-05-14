import axios from 'axios';

// API için temel URL
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor - request başlıklarına token eklemek için
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Yanıt interceptor - token geçersiz ise otomatik çıkış vb.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token geçersiz veya süresi dolmuş
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Backend API metotları
const apiService = {
  // Hisseler
  getAllSymbols: () => api.get('/stocks/symbols'),
  getFilteredSymbols: (refresh = false) => api.get('/stocks/filtered-symbols', { params: { refresh } }),
  getStockBySymbol: (symbol) => api.get(`/stocks/${symbol}`),
  
  // Filtreler ve Tahminler
  getFilteredStocks: (params) => api.get('/stocks/filtered', { params }),
  getFilteredPredictions: (runPredictions = false) => api.get('/stocks/filtered-predictions', { params: { run_predictions: runPredictions } }),
  getPredictionBySymbol: (symbol, refresh = false, modelType = 'all') => api.get(`/stocks/prediction/${symbol}`, { params: { refresh, model_type: modelType } }),
  
  // Saatlik Veri ve Model Özellikleri
  getHourlyData: (symbol, days = 45) => api.get(`/stocks/saatlik-data/${symbol}`, { params: { days } }),
  getModelFeatures: (symbol, days = 45) => api.get(`/stocks/model-features/${symbol}`, { params: { days } }),
};

export default apiService; 