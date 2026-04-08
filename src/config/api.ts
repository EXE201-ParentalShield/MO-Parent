import { Platform } from 'react-native';

const DEPLOYED_BASE_URL = 'https://be-ikk8.onrender.com';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const getDefaultLocalBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5016';
  }

  return 'http://localhost:5016';
};

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = normalizeBaseUrl(
  configuredBaseUrl || getDefaultLocalBaseUrl() || DEPLOYED_BASE_URL
);

export const API_URL = `${API_BASE_URL}/api`;
