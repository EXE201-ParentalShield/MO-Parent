// Shield Family Parent App - Constants
export const COLORS = {
  primary: '#4C9AFF',
  primaryDark: '#3b7dd6',
  primaryLight: '#7db5ff',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#f0f7ff',
  backgroundGradientStart: '#4C9AFF',
  backgroundGradientEnd: '#E8F4FF',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  shadow: 'rgba(76, 154, 255, 0.2)',
  glow: 'rgba(76, 154, 255, 0.3)',
};

export const SCREEN_NAMES = {
  LOGIN: 'Login',
  DASHBOARD: 'Dashboard',
  ACTIVITY: 'Activity',
  DEVICES: 'Devices',
  ACCESS_REQUESTS: 'AccessRequests',
  SETTINGS: 'Settings',
};

export const API_ENDPOINTS = {
  BASE_URL: 'https://api.shieldfamily.com', // Replace with actual API
  LOGIN: '/auth/parent/login',
  DASHBOARD: '/parent/dashboard',
  CHILDREN: '/parent/children',
  DEVICES: '/parent/devices',
  ACTIVITY: '/parent/activity',
  REQUESTS: '/parent/requests',
};

export const STORAGE_KEYS = {
  TOKEN: '@shield_parent_token',
  USER_DATA: '@shield_parent_user',
  SETTINGS: '@shield_parent_settings',
};
