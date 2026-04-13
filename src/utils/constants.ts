// Shield Family Parent App - Constants
export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  secondary: '#0F172A',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#F9FAFB',
  backgroundGradientStart: '#EFF6FF',
  backgroundGradientEnd: '#F0FDF4',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#64748b',
  border: '#E5E7EB',
  shadow: 'rgba(15, 23, 42, 0.08)',
  glow: 'rgba(59, 130, 246, 0.18)',
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
  AUTH_LOGIN_AT: '@shield_parent_auth_login_at',
  SETTINGS: '@shield_parent_settings',
  ACTIVITY_BADGE_LAST_SEEN_AT: '@shield_parent_activity_badge_last_seen_at',
};
