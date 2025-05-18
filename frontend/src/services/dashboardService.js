import api from './api';

// Dashboard için API çağrıları
const dashboardService = {
  // Favori hisseler
  getFavorites: async () => {
    try {
      const response = await api.get('/dashboard/favorites');
      return response.data;
    } catch (error) {
      console.error('Favoriler alınırken hata oluştu:', error);
      return [];
    }
  },

  addFavorite: async (symbol) => {
    try {
      const response = await api.post('/dashboard/favorites', { symbol });
      return response.data;
    } catch (error) {
      console.error('Favori eklenirken hata oluştu:', error);
      throw error;
    }
  },

  removeFavorite: async (symbol) => {
    try {
      const response = await api.delete(`/dashboard/favorites/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Favori silinirken hata oluştu:', error);
      throw error;
    }
  },

  // Son tahminler
  getLatestPredictions: async (limit = 5) => {
    try {
      const response = await api.get('/dashboard/latest-predictions', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Son tahminler alınırken hata oluştu:', error);
      return [];
    }
  },

  // Tahmin geçmişi
  getPredictionHistory: async (limit = 10) => {
    try {
      const response = await api.get('/dashboard/prediction-history', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Tahmin geçmişi alınırken hata oluştu:', error);
      return [];
    }
  },

  // Model karşılaştırması
  getModelComparison: async () => {
    try {
      const response = await api.get('/dashboard/model-comparison');
      return response.data;
    } catch (error) {
      console.error('Model karşılaştırması alınırken hata oluştu:', error);
      return { models: [] };
    }
  },
};

export default dashboardService; 