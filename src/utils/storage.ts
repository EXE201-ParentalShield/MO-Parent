import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const storage = {
  // Token management
  saveToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  saveTokenLoginAt: async (timestamp: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_LOGIN_AT, timestamp.toString());
    } catch (error) {
      console.error('Error saving token login timestamp:', error);
    }
  },

  getTokenLoginAt: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_LOGIN_AT);
    } catch (error) {
      console.error('Error getting token login timestamp:', error);
      return null;
    }
  },

  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_LOGIN_AT);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // User data management
  saveUserData: async (userData: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  getUserData: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.AUTH_LOGIN_AT,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
