import axios from 'axios';

// API için temel URL
const API_URL = 'http://localhost:8000/api';

// Dashboard için API çağrıları
const dashboardService = {
  // Favori hisseler
  getFavorites: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/favorites`);
      return response.data;
    } catch (error) {
      console.error('Favoriler alınırken hata oluştu:', error);
      return [];
    }
  },

  addFavorite: async (symbol) => {
    try {
      const response = await axios.post(`${API_URL}/dashboard/favorites`, { symbol });
      return response.data;
    } catch (error) {
      console.error('Favori eklenirken hata oluştu:', error);
      throw error;
    }
  },

  removeFavorite: async (symbol) => {
    try {
      const response = await axios.delete(`${API_URL}/dashboard/favorites/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Favori silinirken hata oluştu:', error);
      throw error;
    }
  },

  // Son tahminler
  getLatestPredictions: async (limit = 5) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/latest-predictions`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Son tahminler alınırken hata oluştu:', error);
      return [];
    }
  },

  // Tahmin geçmişi
  getPredictionHistory: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/prediction-history`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Tahmin geçmişi alınırken hata oluştu:', error);
      return [];
    }
  },

  // Gerçek veritabanı tahmin geçmişi
  getRealPredictionHistory: async (limit = 20) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/real-prediction-history`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Gerçek tahmin geçmişi alınırken hata oluştu:', error);
      return [];
    }
  },

  // Model karşılaştırması
  getModelComparison: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/model-comparison`);
      return response.data;
    } catch (error) {
      console.error('Model karşılaştırması alınırken hata oluştu:', error);
      return { models: [] };
    }
  },
};

export default dashboardService; 