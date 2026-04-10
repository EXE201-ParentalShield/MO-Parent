import apiClient from './client';
import { handleApiError, logError } from './errorHandler';
import { API_BASE_URL } from '../config/api';

export interface ManagedApp {
  appId: number;
  appName: string;
  packageName: string;
  iconUrl: string;
  isActive: boolean;
}

export interface AppUpsertPayload {
  appName: string;
  packageName: string;
  iconUrl: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const resolveIconUrl = (iconUrl: string): string => {
  const raw = String(iconUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (raw.startsWith('/')) return `${API_BASE_URL}${raw}`;
  return `${API_BASE_URL}/${raw.replace(/^\/+/, '')}`;
};

export const getManagedApps = async (keyword = ''): Promise<ManagedApp[]> => {
  try {
    const res = await apiClient.get<ApiResponse<ManagedApp[]>>('/Apps', {
      params: { keyword },
    });

    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return list.map((item) => ({
      ...item,
      iconUrl: resolveIconUrl(item.iconUrl),
    }));
  } catch (error) {
    logError(error, 'Apps.getManagedApps');
    throw new Error(handleApiError(error));
  }
};

export const createManagedApp = async (payload: AppUpsertPayload): Promise<ManagedApp> => {
  try {
    const res = await apiClient.post<ApiResponse<ManagedApp>>('/Apps', payload);
    if (!res.data?.data) {
      throw new Error('Không thể tạo ứng dụng');
    }

    return res.data.data;
  } catch (error) {
    logError(error, 'Apps.createManagedApp');
    throw new Error(handleApiError(error));
  }
};

export const updateManagedApp = async (
  appId: number,
  payload: AppUpsertPayload
): Promise<ManagedApp> => {
  try {
    const res = await apiClient.put<ApiResponse<ManagedApp>>(`/Apps/${appId}`, payload);
    if (!res.data?.data) {
      throw new Error('Không thể cập nhật ứng dụng');
    }

    return res.data.data;
  } catch (error) {
    logError(error, 'Apps.updateManagedApp');
    throw new Error(handleApiError(error));
  }
};

export const deleteManagedApp = async (appId: number): Promise<void> => {
  try {
    await apiClient.delete(`/Apps/${appId}`);
  } catch (error) {
    logError(error, 'Apps.deleteManagedApp');
    throw new Error(handleApiError(error));
  }
};
