// Shield Parent App - Devices API
import apiClient from './client';
import { handleApiError, logError } from './errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

let parentDevicesInFlight: Promise<Device[]> | null = null;

// Helper to decode JWT and get userId
const getParentIdFromToken = async (): Promise<number | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return null;
    
    // Decode JWT (format: header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    // ClaimTypes.NameIdentifier is stored as "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    return userId ? parseInt(userId) : null;
  } catch (error) {
    console.error('[Device] Error decoding token:', error);
    return null;
  }
};

export interface Device {
  deviceId: number;
  childName: string;
  deviceName: string;
  deviceType: string;
  osVersion: string;
  status: string;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: string;
  lastHeartbeat: string;
  batteryLevel?: number;  // Optional - will be updated from device heartbeat
  storageUsage?: number;  // Optional - will be updated from device heartbeat
}

export interface DeviceResponse {
  success: boolean;
  data: Device[];
}

export interface LockUnlockResponse {
  success: boolean;
  message: string;
  data: {
    deviceId: number;
    isLocked: boolean;
    lockReason?: string;
    lockedAt?: string;
  };
}

export const getParentDevices = async (): Promise<Device[]> => {
  if (parentDevicesInFlight) {
    return parentDevicesInFlight;
  }

  parentDevicesInFlight = (async () => {
    try {
      // Keep a lightweight debug signal instead of verbose token/device dumps.
      const parentIdFromToken = await getParentIdFromToken();
      if (__DEV__) {
        console.log('[Devices.getParentDevices] Fetching devices for parent:', parentIdFromToken);
      }

      const response = await apiClient.get<DeviceResponse>('/parent/devices');

      if (!response.data) {
        return [];
      }

      // Handle both response.data and response.data.data
      const devices = response.data.data || response.data;

      if (!Array.isArray(devices)) {
        return [];
      }

      return devices;
    } catch (error) {
      logError(error, 'Devices.getParentDevices');
      throw new Error(handleApiError(error));
    } finally {
      parentDevicesInFlight = null;
    }
  })();

  return parentDevicesInFlight;
};

export const lockDevice = async (deviceId: number, reason?: string): Promise<LockUnlockResponse> => {
  try {
    const response = await apiClient.post<LockUnlockResponse>(
      `/parent/lock/${deviceId}`,
      { reason }
    );
    return response.data;
  } catch (error) {
    logError(error, 'Devices.lockDevice');
    throw new Error(handleApiError(error));
  }
};

export const unlockDevice = async (deviceId: number): Promise<LockUnlockResponse> => {
  try {
    const response = await apiClient.post<LockUnlockResponse>(`/parent/unlock/${deviceId}`);
    return response.data;
  } catch (error) {
    logError(error, 'Devices.unlockDevice');
    throw new Error(handleApiError(error));
  }
};

export interface UsageReportResponse {
  success: boolean;
  message: string;
  data: {
    deviceId: number;
    childName: string;
    totalDevices: number;
    lockedDevices: number;
    dailyUsage: Array<{
      date: string;
      usageMinutes: number;
      sessionCount: number;
    }>;
    totalUsageMinutes: number;
    reportDate: string;
  };
}

export interface EntitlementDevice {
  deviceId: number;
  childName: string;
  deviceName: string;
  deviceUniqueId: string;
}

export interface DeviceEntitlementStatus {
  hasAccess: boolean;
  maxDevices: number;
  currentDevices: number;
  requiresDeviceSelection: boolean;
  message?: string;
  selectableDevices: EntitlementDevice[];
}

export const getUsageReport = async (
  childId: number,
  fromDate?: Date,
  toDate?: Date
): Promise<UsageReportResponse['data']> => {
  try {
    const params: any = { childId };
    
    if (fromDate) {
      params.fromDate = fromDate.toISOString();
    }
    
    if (toDate) {
      params.toDate = toDate.toISOString();
    }
    
    const response = await apiClient.get<UsageReportResponse>('/parent/usage-report', { params });
    
    console.log('[Devices.getUsageReport] Usage report:', response.data.data);
    return response.data.data;
  } catch (error) {
    logError(error, 'Devices.getUsageReport');
    throw new Error(handleApiError(error));
  }
};

export const getDeviceEntitlementStatus = async (): Promise<DeviceEntitlementStatus> => {
  try {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: DeviceEntitlementStatus;
    }>('/parent/device-entitlement');

    return response.data.data;
  } catch (error) {
    logError(error, 'Devices.getDeviceEntitlementStatus');
    throw new Error(handleApiError(error));
  }
};

export const resolveDowngradeSelection = async (keptDeviceId: number): Promise<DeviceEntitlementStatus> => {
  try {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: DeviceEntitlementStatus;
    }>('/parent/resolve-downgrade', {
      keptDeviceId,
    });

    return response.data.data;
  } catch (error) {
    logError(error, 'Devices.resolveDowngradeSelection');
    throw new Error(handleApiError(error));
  }
};
