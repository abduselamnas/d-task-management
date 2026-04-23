import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use localhost for web, for physical device use your computer's IP
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  async (config) => {
    // Get token from storage for each request
    const token = await AsyncStorage.getItem('token');
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, { 
      hasToken: !!token,
      url: config.url
    });
    
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;