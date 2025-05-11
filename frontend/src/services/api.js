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

export default api; 