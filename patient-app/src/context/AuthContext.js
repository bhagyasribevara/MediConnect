import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token exists on load
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      let userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUserToken(token);
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.log(`isLoggedIn error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.token) {
        const token = response.data.token;
        // In this implementation the backend doesn't explicitly return user object, 
        // we'll just store username for display
        const userData = { username };
        setUserToken(token);
        setUser(userData);
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, password, email) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { 
        username, 
        password, 
        phone_number: email, // Backend uses phone_number, not email
        role: 'Patient' 
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUserToken(null);
      setUser(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.log(`logout error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ login, logout, register, user, userToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
