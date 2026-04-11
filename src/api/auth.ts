// Shield Parent App - Auth API
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { handleApiError, logError } from './errorHandler';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    phoneNumber: string;
  };
  token: string;
}

export const register = async (
  username: string,
  password: string,
  fullName: string,
  email: string,
  phoneNumber?: string
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/register', {
      username,
      password,
      confirmPassword: password,
      fullName,
      email,
      phoneNumber: phoneNumber || '',
    });
    
    if (response.data.success && response.data.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_LOGIN_AT, Date.now().toString());
      
    }
    
    return response.data;
  } catch (error) {
    logError(error, 'Auth.register');
    throw new Error(handleApiError(error));
  }
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    
    if (response.data.success && response.data.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_LOGIN_AT, Date.now().toString());
      

    }
    
    return response.data;
  } catch (error) {
    logError(error, 'Auth.login');
    throw new Error(handleApiError(error));
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_LOGIN_AT);
  } catch (error) {
    logError(error, 'Auth.logout');
    throw error;
  }
};
