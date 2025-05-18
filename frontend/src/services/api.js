import axios from 'axios';

// API için temel URL - Docker ortamında çalışırken
const baseURL = 'http://localhost:8000/api';

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
    // CORS için ek header'lar
    config.headers['Access-Control-Allow-Origin'] = '*';
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor - hata yönetimi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
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
  getPotentialRisers: (force = false) => api.get('/stocks/filtered-predictions', { params: { run_predictions: force, timeout: 60 } }),
  
  // Saatlik Veri ve Model Özellikleri
  getHourlyData: (symbol, days = 45) => api.get(`/stocks/saatlik-data/${symbol}`, { params: { days } }),
  getModelFeatures: (symbol, days = 45) => api.get(`/stocks/model-features/${symbol}`, { params: { days } }),
};

export default apiService; 