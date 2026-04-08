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
      
      // Log token for Swagger testing
      console.log('\n🔑 TOKEN FOR SWAGGER:');
      console.log(response.data.token);
      console.log('\n');
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
      
      console.log('[Auth.login] UserId being stored:', response.data.user.userId);
      console.log('[Auth.login] User data:', JSON.stringify(response.data.user, null, 2));
      
      // Log token for Swagger testing
      console.log('\n🔑 TOKEN FOR SWAGGER:');
      console.log(response.data.token);
      console.log('\n');
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
  } catch (error) {
    logError(error, 'Auth.logout');
    throw error;
  }
};
