import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      console.log('Loading stored data - token:', token ? 'exists' : 'none');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        api.defaults.headers.common['x-auth-token'] = token;
        console.log('User loaded:', parsedUser.email);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login attempt:', email);
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['x-auth-token'] = token;
      
      setUser(user);
      console.log('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear axios headers
      delete api.defaults.headers.common['x-auth-token'];
      
      // Reset user state to null
      setUser(null);
      
      console.log('Logout successful, user set to null');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};