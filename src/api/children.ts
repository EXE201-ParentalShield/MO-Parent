// Shield Parent App - Children API (Create Child Account)
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { handleApiError, logError } from './errorHandler';

export interface CreateChildAccountData {
  childName: string;
  username: string;
  password: string;
  deviceName?: string;
  deviceType?: string;
  osVersion?: string;
}

export interface CreateChildAccountResponse {
  success: boolean;
  message: string;
  data: {
    deviceId: number;
    deviceUniqueId: string;
    deviceName: string;
    deviceType: string;
    status: string;
    isLocked: boolean;
    lockReason?: string;
    lockedAt?: string;
    lastHeartbeat: string;
    batteryLevel: number;
    storageUsage: number;
    approvedRequestId?: number;
    approvedMinutes?: number;
  };
}

export const createChildAccount = async (data: CreateChildAccountData): Promise<CreateChildAccountResponse> => {
  try {
    // Get parent userId from storage
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!userData) {
      throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
    }
    
    const user = JSON.parse(userData);
    const parentId =
      Number(user?.userId) ||
      Number(user?.id) ||
      Number(user?.userID) ||
      Number(user?.UserId) ||
      Number(user?.Id) ||
      0;

    if (!parentId) {
      throw new Error('Không xác định được parentId. Vui lòng đăng nhập lại.');
    }
    
    const requestBody = {
      parentId: parentId,
      username: data.username,
      password: data.password,
      childName: data.childName,
      deviceUniqueId: `${parentId}_${data.username}_${Date.now()}`,
      deviceName: data.deviceName || data.childName || 'Child Device',
      deviceType: data.deviceType || 'Android',
      osVersion: data.osVersion || '0',
      status: 1, // DeviceStatus.Active = 1
      isLocked: true // Start in Kiosk Mode
    };

    console.log('[CreateChild] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await apiClient.post<CreateChildAccountResponse>('/admin/devices/register', requestBody);

    console.log('[CreateChild] Success - DeviceId:', response.data.data?.deviceId);
    return response.data;
  } catch (error: any) {
    logError(error, 'Children.createChildAccount');
    
    // If it's already a user-friendly message, throw as is
    if (error.message && (
      error.message.includes('Phiên đăng nhập') || 
      error.message.includes('Không tìm thấy thông tin')
    )) {
      throw error;
    }
    
    // Otherwise, use error handler
    throw new Error(handleApiError(error));
  }
};
