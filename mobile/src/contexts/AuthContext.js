import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

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
      console.log('Loading stored data - userData:', userData);
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Set token in axios defaults
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
      console.log('Login response status:', response.status);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set token in axios defaults for future requests
      api.defaults.headers.common['x-auth-token'] = token;
      
      setUser(user);
      console.log('Login successful, user set:', user.email);
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
      return false;
    }
  };

  const logout = async () => {
    console.log('Logging out');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'project_manager' || user?.role === 'admin',
    isTeamMember: user?.role === 'team_member',
  };

  console.log('AuthContext state:', { 
    isAuthenticated: !!user, 
    role: user?.role,
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};