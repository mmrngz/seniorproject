import axios from 'axios';

// API için temel URL
const API_URL = 'http://localhost:8000/api';

// UserService sınıfı
const userService = {
  // Kullanıcı girişi
  login: async (email, password) => {
    try {
      // URLSearchParams formatında gönder (OAuth2 standardı)
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (response.data) {
        // Kullanıcı bilgilerini ve token'ı localStorage'a kaydet
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Giriş yapılırken bir hata oluştu';
      throw new Error(message);
    }
  },
  
  // Kullanıcı kaydı
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Kayıt olurken bir hata oluştu';
      throw new Error(message);
    }
  },
  
  // Kullanıcı çıkışı
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
  
  // Mevcut kullanıcıyı getir
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  // Kullanıcı giriş yapmış mı kontrol et
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  // Kullanıcı listesini getir
  getUsers: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Kullanıcılar getirilirken bir hata oluştu';
      throw new Error(message);
    }
  },
  
  // Kullanıcı bilgilerini getir
  getUser: async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Kullanıcı bilgileri getirilirken bir hata oluştu';
      throw new Error(message);
    }
  }
};

export default userService; 